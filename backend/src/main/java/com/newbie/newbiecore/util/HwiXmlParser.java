// src/main/java/com/newbie/newbiecore/util/HwiXmlParser.java
package com.newbie.newbiecore.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.w3c.dom.*;
import org.xml.sax.EntityResolver;
import org.xml.sax.InputSource;

import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.xpath.*;
import java.io.InputStream;
import java.io.StringReader;
import java.util.*;

@Component
public class HwiXmlParser {

    private final XPath xp = XPathFactory.newInstance().newXPath();
    private final ObjectMapper objectMapper;

    public HwiXmlParser(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public static class HardwareSnapshot {
        public General general = new General();
        public CPU cpu = new CPU();
        public MOBO mobo = new MOBO();
        public List<GPU> gpus = new ArrayList<>();
        public List<Drive> drives = new ArrayList<>();
        public BIOS bios = new BIOS();
        public Map<String,Object> extras = new LinkedHashMap<>();
        public static class General { public String hostname, marca, so; public boolean uefi, secureBoot; }
        public static class CPU { public String nombre; public Integer nucleos, hilos; public String socket; }
        public static class MOBO { public String fabricante, modelo, serie; }
        public static class GPU { public String nombre, board, vram; }
        public static class Drive { public String nombre, tipo, capacidad, serie; }
        public static class BIOS { public String fabricante, version, fecha; }
    }

    public HardwareSnapshot parse(InputStream in) {
        try {
            DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
            dbf.setXIncludeAware(false);
            dbf.setExpandEntityReferences(false);
            try {
                dbf.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
                dbf.setFeature("http://apache.org/xml/features/disallow-doctype-decl", false);
            } catch (Exception ignore) {}

            var builder = dbf.newDocumentBuilder();
            builder.setEntityResolver(new EntityResolver() {
                @Override public InputSource resolveEntity(String publicId, String systemId) {
                    // Evita cargar HWiNFO32log.dtd (o cualquier DTD externo)
                    return new InputSource(new StringReader(""));
                }
            });

            Document doc = builder.parse(in);
            doc.getDocumentElement().normalize();
            HardwareSnapshot hw = new HardwareSnapshot();

            // --- General ---
            hw.general.hostname   = eval(doc, "/HWINFO/COMPUTER/NodeName");
            hw.general.marca      = prop(doc, "Nombre de marca de computadora");
            hw.general.so         = prop(doc, "Sistema operativo");
            hw.general.uefi       = "Presente".equalsIgnoreCase(prop(doc, "Arranque UEFI"));
            hw.general.secureBoot = "Activado".equalsIgnoreCase(prop(doc, "Arranque seguro"));

            // --- CPU ---
            hw.cpu.nombre  = firstNonNull(
                    propUnder(doc, "//CPU/SubNode", "Nombre del procesador"),
                    eval(doc, "//CPU/SubNode[1]/NodeName")
            );
            hw.cpu.nucleos = toInt(prop(doc, "Número de núcleos de procesador"));
            hw.cpu.hilos   = toInt(prop(doc, "Número de procesadores lógicos"));
            hw.cpu.socket  = prop(doc, "Actualización del procesador");

            // --- MOBO ---
            hw.mobo.fabricante = propUnder(doc, "//MOBO/SubNode[NodeName='Sistema']", "Fabricante del sistema");
            if (hw.mobo.fabricante == null) hw.mobo.fabricante = prop(doc, "Nombre de marca de computadora");
            hw.mobo.modelo = firstNonNull(
                    prop(doc, "Modelo de placa base"),
                    propUnder(doc, "//MOBO/SubNode[NodeName='tarjeta madre']", "Nombre de la placa base")
            );
            hw.mobo.serie  = propUnder(doc, "//MOBO/SubNode[NodeName='tarjeta madre']", "Número de serie de la placa base");

            // --- GPUs ---
            NodeList gpuNodes = nodes(doc, "//VIDEO/SubNode");
            for (int i = 0; i < gpuNodes.getLength(); i++) {
                Node n = gpuNodes.item(i);
                String nombre = propHere(n, "Chipset de gráficos");
                if (nombre == null) continue;
                var g = new HardwareSnapshot.GPU();
                g.nombre = nombre;
                g.board  = propHere(n, "Tarjeta grafica");
                g.vram   = propHere(n, "Memoria gráfica");
                hw.gpus.add(g);
            }

            // --- DRIVES (NVMe) ---
            NodeList driveNodes = nodes(doc, "//DRIVES/SubNode[NodeName='Unidades NVMe']/SubNode");
            for (int i = 0; i < driveNodes.getLength(); i++) {
                Node n = driveNodes.item(i);
                var d = new HardwareSnapshot.Drive();
                d.nombre    = eval(n, "./NodeName");
                d.tipo      = propHere(n, "Controlador de disco");
                d.capacidad = firstNonNull(propHere(n, "Capacidad de la unidad"), propHere(n, "Drive Capacity [MB]"));
                d.serie     = propHere(n, "Número de serie de la unidad");
                hw.drives.add(d);
            }

            // --- BIOS ---
            Node bios = node(doc, "//SubNode[NodeName='BIOS']");
            if (bios != null) {
                hw.bios.fabricante = propHere(bios, "Fabricante de BIOS");
                hw.bios.version    = propHere(bios, "Versión de BIOS");
                hw.bios.fecha      = propHere(bios, "Fecha de lanzamiento del BIOS (mm/dd/yyyy)");
            }

            // --- Extras (ejemplo: TPM) ---
            Map<String,Object> extras = new LinkedHashMap<>();
            extras.put("TPM", propUnder(doc, "//MOBO", "Chip del módulo de plataforma segura (TPM)"));
            hw.extras = extras;

            return hw;
        } catch (Exception e) {
            throw new RuntimeException("Error parseando XML HWiNFO", e);
        }
    }

    // ---------- Helpers XPath ----------
    private String prop(Document doc, String entry){
        return eval(doc, "/HWINFO/COMPUTER/Property[Entry='"+entry+"']/Description");
    }
    private String propUnder(Document doc, String contextXPath, String entry){
        return eval(doc, contextXPath + "//Property[Entry='"+entry+"']/Description");
    }
    private String propHere(Node context, String entry){
        return eval(context, ".//Property[Entry='"+entry+"']/Description");
    }
    private Node node(Document doc, String xpExpr) {
        try { return (Node) xp.evaluate(xpExpr, doc, XPathConstants.NODE); } catch (Exception e){ return null; }
    }
    private NodeList nodes(Document doc, String xpExpr) {
        try { return (NodeList) xp.evaluate(xpExpr, doc, XPathConstants.NODESET); } catch (Exception e){ return null; }
    }
    private String eval(Object x, String xpExpr){
        try {
            String s = xp.evaluate(xpExpr, x);
            return (s != null && !s.isBlank()) ? s.trim() : null;
        } catch(Exception e){ return null; }
    }
    private Integer toInt(String s){ try { return (s==null)? null : Integer.parseInt(s.replaceAll("[^0-9]","")); } catch(Exception e){ return null; } }
    private String firstNonNull(String... xs){ for(String s: xs) if (s!=null && !s.isBlank()) return s; return null; }

    public String toJson(HardwareSnapshot hw) {
        try { return objectMapper.writeValueAsString(hw); }
        catch (Exception e) { throw new RuntimeException(e); }
    }
    // dentro de HwiXmlParser.java
    public static class PropertyRow {
        public String path;
        public String entry;
        public String value;
        public String unit;
    }

    public List<PropertyRow> collectAllProperties(InputStream in) {
        try {
            DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
            dbf.setXIncludeAware(false);
            dbf.setExpandEntityReferences(false);
            try {
                dbf.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
                dbf.setFeature("http://apache.org/xml/features/disallow-doctype-decl", false);
            } catch (Exception ignore) {}

            var builder = dbf.newDocumentBuilder();
            builder.setEntityResolver((publicId, systemId) -> new InputSource(new StringReader("")));
            Document doc = builder.parse(in);
            doc.getDocumentElement().normalize();

            NodeList properties = (NodeList) xp.evaluate("//Property", doc, XPathConstants.NODESET);
            List<PropertyRow> rows = new ArrayList<>(properties.getLength());

            for (int i = 0; i < properties.getLength(); i++) {
                Element p = (Element) properties.item(i);
                String entry = text(p, "Entry");
                String value = text(p, "Description");
                if ((entry == null || entry.isBlank()) && (value == null || value.isBlank())) continue;

                PropertyRow r = new PropertyRow();
                r.path  = computePath(p);
                r.entry = safe(entry);
                r.value = safe(value);
                r.unit  = text(p, "Unit"); // opcional si existe en tu XML
                rows.add(r);
            }
            return rows;
        } catch (Exception e) {
            throw new RuntimeException("Error recolectando propiedades del XML HWiNFO", e);
        }
    }


    private static String safe(String s) { return s == null ? null : s.trim(); }

    // Ruta legible usando NodeName cuando exista + índice de hermanos
    private String computePath(Node leaf) {
        Deque<String> parts = new ArrayDeque<>();
        Node cur = leaf;
        while (cur != null && cur.getNodeType() == Node.ELEMENT_NODE) {
            Element el = (Element) cur;

            String nodeNameText = null;
            NodeList nodeNameNodes = el.getElementsByTagName("NodeName");
            if (nodeNameNodes.getLength() > 0) {
                nodeNameText = nodeNameNodes.item(0).getTextContent();
            }

            String label;
            if (nodeNameText != null && !nodeNameText.isBlank()) {
                label = el.getTagName() + "(" + nodeNameText.trim() + ")";
            } else {
                int idx = siblingIndex(el);
                label = el.getTagName() + "#" + idx;
            }
            parts.addFirst(label);

            cur = el.getParentNode();
            if (cur != null && cur.getNodeType() == Node.DOCUMENT_NODE) break;
        }
        return String.join(" > ", parts);
    }

    private int siblingIndex(Element el) {
        int idx = 0;
        Node prev = el.getPreviousSibling();
        while (prev != null) {
            if (prev.getNodeType() == Node.ELEMENT_NODE
                    && ((Element) prev).getTagName().equals(el.getTagName())) {
                idx++;
            }
            prev = prev.getPreviousSibling();
        }
        return idx;
    }
    // HwiXmlParser.java
    public Map<String, String> collectByEntry(InputStream in) {
        try {
            DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
            dbf.setXIncludeAware(false);
            dbf.setExpandEntityReferences(false);
            try {
                dbf.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
                dbf.setFeature("http://apache.org/xml/features/disallow-doctype-decl", false);
            } catch (Exception ignore) {}

            var builder = dbf.newDocumentBuilder();
            builder.setEntityResolver((publicId, systemId) -> new org.xml.sax.InputSource(new java.io.StringReader("")));
            org.w3c.dom.Document doc = builder.parse(in);
            doc.getDocumentElement().normalize();

            javax.xml.xpath.XPath xp = javax.xml.xpath.XPathFactory.newInstance().newXPath();
            org.w3c.dom.NodeList props = (org.w3c.dom.NodeList)
                    xp.evaluate("//Property", doc, javax.xml.xpath.XPathConstants.NODESET);

            Map<String,String> map = new java.util.LinkedHashMap<>();
            for (int i = 0; i < props.getLength(); i++) {
                org.w3c.dom.Element p = (org.w3c.dom.Element) props.item(i);
                String entry = text(p, "Entry");
                String value = text(p, "Description");
                if (entry != null && !entry.isBlank() && value != null && !value.isBlank()) {
                    map.put(entry.trim(), value.trim()); // último valor para la misma clave “gana”
                }
            }
            return map;
        } catch (Exception e) {
            throw new RuntimeException("Error construyendo byEntry desde XML HWiNFO", e);
        }
    }
    // --- NUEVO: devuelve un JSON agrupado por secciones ---
    public Map<String, Object> collectGroupedByEntry(InputStream in) {
        try {
            // Parser DOM seguro (igual que parse(...))
            DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
            dbf.setXIncludeAware(false);
            dbf.setExpandEntityReferences(false);
            try {
                dbf.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
                dbf.setFeature("http://apache.org/xml/features/disallow-doctype-decl", false);
            } catch (Exception ignore) {}
            var builder = dbf.newDocumentBuilder();
            builder.setEntityResolver((publicId, systemId) -> new InputSource(new StringReader("")));
            Document doc = builder.parse(in);
            doc.getDocumentElement().normalize();

            Map<String, Object> out = new LinkedHashMap<>();

            // Secciones "simples": tomamos todas sus Properties
            out.put("computer", byEntryFrom(node(doc, "/HWINFO/COMPUTER")));
            out.put("cpu",      byEntryFrom(node(doc, "//CPU")));
            out.put("mobo",     byEntryFrom(node(doc, "//MOBO")));
            out.put("memory",   byEntryFrom(node(doc, "//MEMORY")));

            // Secciones con múltiples dispositivos: submapa por SubNode (NodeName)
            out.put("video",   byEntryPerDevice(doc, "//VIDEO"));
            out.put("monitor", byEntryPerDevice(doc, "//MONITOR"));
            out.put("sound",   byEntryPerDevice(doc, "//SOUND"));
            out.put("network", byEntryPerDevice(doc, "//NETWORK"));

            // DRIVES: combinamos ATA y NVMe, cada unidad como submapa
            Map<String, Map<String,String>> drives = new LinkedHashMap<>();
            drives.putAll(byEntryPerDevice(doc, "//DRIVES/SubNode[NodeName='ATA Drives']"));
            drives.putAll(byEntryPerDevice(doc, "//DRIVES/SubNode[NodeName='Unidades NVMe']"));
            out.put("drives", drives);

            return out;
        } catch (Exception e) {
            throw new RuntimeException("Error agrupando byEntry", e);
        }
    }

// --- helpers privados ---

    // Extrae Entry→Description bajo un contexto (sección o SubNode)
    private Map<String,String> byEntryFrom(Node context) {
        Map<String,String> m = new LinkedHashMap<>();
        if (context == null) return m;
        try {
            NodeList props = (NodeList) xp.evaluate(".//Property", context, XPathConstants.NODESET);
            for (int i = 0; i < props.getLength(); i++) {
                Node p = props.item(i);
                String k = eval(p, "./Entry");
                String v = eval(p, "./Description");
                if (k != null && !k.isBlank() && v != null && !v.isBlank()) {
                    m.put(k, v);
                }
            }
        } catch (Exception ignore) {}
        return m;
    }

    // Recorre los SubNode hijos de una sección y crea un submapa por dispositivo
    private Map<String, Map<String,String>> byEntryPerDevice(Document doc, String sectionXPath) {
        Map<String, Map<String,String>> out = new LinkedHashMap<>();
        Node section = node(doc, sectionXPath);
        if (section == null) return out;

        try {
            NodeList subs = (NodeList) xp.evaluate("./SubNode", section, XPathConstants.NODESET);
            for (int i = 0; i < subs.getLength(); i++) {
                Node sub = subs.item(i);
                String name = firstNonNull(eval(sub, "./NodeName"), "device#" + (i+1));
                Map<String,String> props = byEntryFrom(sub);
                if (!props.isEmpty()) out.put(name, props);
            }
        } catch (Exception ignore) {}
        return out;
    }

    private static String text(org.w3c.dom.Element parent, String tag) {
        org.w3c.dom.NodeList nl = parent.getElementsByTagName(tag);
        if (nl.getLength() == 0) return null;
        String s = nl.item(0).getTextContent();
        return (s == null) ? null : s.trim();
    }

}
