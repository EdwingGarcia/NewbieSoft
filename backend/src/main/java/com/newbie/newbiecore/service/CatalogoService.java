package com.newbie.newbiecore.service;

import com.newbie.newbiecore.dto.catalogo.CatalogoItemDto;
import com.newbie.newbiecore.entity.CatalogoItem;
import com.newbie.newbiecore.repository.CatalogoItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CatalogoService {

    private final CatalogoItemRepository repository;

    @Transactional(readOnly = true)
    public List<CatalogoItemDto> listar(String search) {
        var items = (search == null || search.isBlank())
                ? repository.findByActivoTrue()
                : repository.findByActivoTrueAndDescripcionContainingIgnoreCase(search);

        return items.stream()
                .map(i -> new CatalogoItemDto(
                        i.getId(),
                        i.getTipo(),
                        i.getDescripcion(),
                        i.getCosto()
                ))
                .toList();
    }

    @Transactional
    public CatalogoItem crear(CatalogoItem item) {

        if (item.getTipo() == null ||
            (!item.getTipo().equalsIgnoreCase("PRODUCTO") &&
            !item.getTipo().equalsIgnoreCase("SERVICIO"))) {
            throw new IllegalArgumentException("El tipo debe ser PRODUCTO o SERVICIO");
        }

        if (item.getDescripcion() == null || item.getDescripcion().isBlank()) {
            throw new IllegalArgumentException("La descripción es obligatoria");
        }

        if (item.getCosto() == null || item.getCosto().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("El costo debe ser mayor a 0");
        }

        item.setActivo(true);
        item.setTipo(item.getTipo().toUpperCase());

        return repository.save(item);
    }


    @Transactional
    public CatalogoItem actualizar(Long id, CatalogoItem data) {

        var item = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ítem no encontrado"));

        if (data.getTipo() == null ||
            (!data.getTipo().equalsIgnoreCase("PRODUCTO") &&
            !data.getTipo().equalsIgnoreCase("SERVICIO"))) {
            throw new IllegalArgumentException("El tipo debe ser PRODUCTO o SERVICIO");
        }

        if (data.getDescripcion() == null || data.getDescripcion().isBlank()) {
            throw new IllegalArgumentException("La descripción es obligatoria");
        }

        if (data.getCosto() == null || data.getCosto().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("El costo debe ser mayor a 0");
        }

        item.setTipo(data.getTipo().toUpperCase());
        item.setDescripcion(data.getDescripcion());
        item.setCosto(data.getCosto());

        return repository.save(item);
    }


    @Transactional
    public void eliminar(Long id) {
        var item = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ítem no encontrado"));
        item.setActivo(false);
        repository.save(item);
    }

}
