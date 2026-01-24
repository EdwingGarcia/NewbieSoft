package com.newbie.newbiecore.service.documentos;

import com.newbie.newbiecore.controller.PdfController;
import com.newbie.newbiecore.dto.FichaTecnica.FichaTecnicaDTO;
import com.newbie.newbiecore.dto.FichaTecnica.FichaTecnicaMapper;
import com.newbie.newbiecore.dto.FichaTecnica.FichaTecnicaPdfLikeMergeUtil;
import com.newbie.newbiecore.entity.FichaTecnica;
import com.newbie.newbiecore.repository.FichaTecnicaRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FichasTecnicasMasivasService {

    private final FichaTecnicaRepository fichaTecnicaRepository;
    private final PdfController pdfController;

    public FichasTecnicasMasivasService(
            FichaTecnicaRepository fichaTecnicaRepository,
            PdfController pdfController
    ) {
        this.fichaTecnicaRepository = fichaTecnicaRepository;
        this.pdfController = pdfController;
    }

    public void generarPdfsPorOrdenTrabajo(Long ordenTrabajoId) {

        List<FichaTecnica> fichas =
                fichaTecnicaRepository.findByOrdenTrabajoId(ordenTrabajoId);

        if (fichas.isEmpty()) {
            throw new RuntimeException(
                    "La OT no tiene fichas técnicas asociadas"
            );
        }

        for (FichaTecnica ficha : fichas) {

            // 1️⃣ DTO COMPLETO desde BD / XML
            FichaTecnicaDTO dtoBase =
                    FichaTecnicaMapper.toDTO(ficha);

            // 2️⃣ DTO del flujo
            FichaTecnicaDTO dtoFlujo = new FichaTecnicaDTO();

            dtoFlujo.setId(ficha.getId());
            dtoFlujo.setEquipoId(ficha.getEquipoId());
            dtoFlujo.setObservaciones(ficha.getObservaciones());

            if (ficha.getOrdenTrabajo() != null) {
                dtoFlujo.setOrdenTrabajoId(
                        ficha.getOrdenTrabajo().getId()
                );
            }

            // 3️⃣ MERGE (misma lógica del PdfController)
            FichaTecnicaDTO dtoFinal =
                    FichaTecnicaPdfLikeMergeUtil.mergeLikePdf(
                            dtoBase,
                            dtoFlujo
                    );

            // 4️⃣ PDF (una sola vez)
            pdfController.generarPdfFicha(dtoFinal);
        }
    }
}
