package com.newbie.newbiecore.service;

import com.newbie.newbiecore.entity.FirmaDigital;
import com.newbie.newbiecore.entity.TipoFirma;
import com.newbie.newbiecore.repository.FichaTecnicaRepository;
import com.newbie.newbiecore.repository.FirmaDigitalRepository;
import com.newbie.newbiecore.repository.ReparacionRepository;
import com.newbie.newbiecore.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
public class FirmaDigitalService {

    private final FirmaDigitalRepository firmaDigitalRepository;
    private final ReparacionRepository reparacionRepository;
    private final FichaTecnicaRepository fichaTecnicaRepository;
    private final UsuarioRepository usuarioRepository;

    public FirmaDigitalService(FirmaDigitalRepository firmaDigitalRepository,
                               ReparacionRepository reparacionRepository,
                               FichaTecnicaRepository fichaTecnicaRepository,
                               UsuarioRepository usuarioRepository) {
        this.firmaDigitalRepository = firmaDigitalRepository;
        this.reparacionRepository = reparacionRepository;
        this.fichaTecnicaRepository = fichaTecnicaRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public FirmaDigital firmarReparacion(Long reparacionId,
                                         String cedulaFirmante,
                                         TipoFirma tipo,
                                         String firmaBase64) {

        var reparacion = reparacionRepository.findById(reparacionId)
                .orElseThrow(() -> new IllegalArgumentException("Reparación no encontrada"));

        var usuario = usuarioRepository.findById(cedulaFirmante)
                .orElseThrow(() -> new IllegalArgumentException("Usuario firmante no encontrado"));

        // opcional: evitar doble firma del mismo tipo
        firmaDigitalRepository
                .findByReparacion_IdReparacionAndFirmante_CedulaAndTipo(reparacionId, cedulaFirmante, tipo)
                .ifPresent(f -> {
                    throw new IllegalArgumentException("Este usuario ya firmó esta reparación con ese tipo.");
                });

        var firma = FirmaDigital.builder()
                .reparacion(reparacion)
                .firmante(usuario)
                .tipo(tipo)
                .firmaBase64(firmaBase64)
                .build();

        return firmaDigitalRepository.save(firma);
    }

    public FirmaDigital firmarFichaTecnica(Long fichaId,
                                           String cedulaFirmante,
                                           TipoFirma tipo,
                                           String firmaBase64) {

        var ficha = fichaTecnicaRepository.findById(fichaId)
                .orElseThrow(() -> new IllegalArgumentException("Ficha técnica no encontrada"));

        var usuario = usuarioRepository.findById(cedulaFirmante)
                .orElseThrow(() -> new IllegalArgumentException("Usuario firmante no encontrado"));

        firmaDigitalRepository
                .findByFichaTecnica_IdAndFirmante_CedulaAndTipo(fichaId, cedulaFirmante, tipo)
                .ifPresent(f -> {
                    throw new IllegalArgumentException("Este usuario ya firmó esta ficha con ese tipo.");
                });

        var firma = FirmaDigital.builder()
                .fichaTecnica(ficha)
                .firmante(usuario)
                .tipo(tipo)
                .firmaBase64(firmaBase64)
                .build();

        return firmaDigitalRepository.save(firma);
    }
}

