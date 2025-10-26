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
}
