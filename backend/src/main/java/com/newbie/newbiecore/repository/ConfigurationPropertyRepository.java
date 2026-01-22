package com.newbie.newbiecore.repository;

import com.newbie.newbiecore.entity.ConfigurationProperty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository para operaciones con ConfigurationProperty.
 */
@Repository
public interface ConfigurationPropertyRepository extends JpaRepository<ConfigurationProperty, Long> {

    /**
     * Busca una propiedad por su clave
     */
    @Query("SELECT c FROM ConfigurationProperty c WHERE c.key = :key")
    Optional<ConfigurationProperty> findByKey(@Param("key") String key);

    /**
     * Busca una propiedad activa por su clave
     */
    @Query("SELECT c FROM ConfigurationProperty c WHERE c.key = :key AND c.isActive = true")
    Optional<ConfigurationProperty> findActiveByKey(@Param("key") String key);

    /**
     * Obtiene todas las propiedades ordenadas por categoría y clave
     */
    @Query("SELECT c FROM ConfigurationProperty c ORDER BY c.category, c.key")
    List<ConfigurationProperty> findAllOrderByCategoryAndKey();

    /**
     * Obtiene todas las propiedades activas ordenadas por categoría y clave
     */
    @Query("SELECT c FROM ConfigurationProperty c WHERE c.isActive = true ORDER BY c.category, c.key")
    List<ConfigurationProperty> findAllActiveOrderByCategoryAndKey();

    /**
     * Obtiene propiedades por categoría ordenadas por clave
     */
    @Query("SELECT c FROM ConfigurationProperty c WHERE c.category = :category ORDER BY c.key")
    List<ConfigurationProperty> findByCategoryOrderByKeyAsc(@Param("category") String category);

    /**
     * Obtiene propiedades activas por categoría ordenadas por clave
     */
    @Query("SELECT c FROM ConfigurationProperty c WHERE c.category = :category AND c.isActive = true ORDER BY c.key")
    List<ConfigurationProperty> findActiveByCategoryOrderByKeyAsc(@Param("category") String category);

    /**
     * Obtiene todas las categorías únicas
     */
    @Query("SELECT DISTINCT c.category FROM ConfigurationProperty c ORDER BY c.category")
    List<String> findAllCategories();

    /**
     * Obtiene todas las categorías únicas de propiedades activas
     */
    @Query("SELECT DISTINCT c.category FROM ConfigurationProperty c WHERE c.isActive = true ORDER BY c.category")
    List<String> findAllActiveCategories();

    /**
     * Busca propiedades por texto en clave o descripción
     */
    @Query("SELECT c FROM ConfigurationProperty c WHERE " +
            "LOWER(c.key) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
            "LOWER(c.description) LIKE LOWER(CONCAT('%', :searchText, '%')) " +
            "ORDER BY c.category, c.key")
    List<ConfigurationProperty> searchByKeyOrDescription(@Param("searchText") String searchText);

    /**
     * Busca propiedades activas por texto en clave o descripción
     */
    @Query("SELECT c FROM ConfigurationProperty c WHERE c.isActive = true AND (" +
            "LOWER(c.key) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
            "LOWER(c.description) LIKE LOWER(CONCAT('%', :searchText, '%'))) " +
            "ORDER BY c.category, c.key")
    List<ConfigurationProperty> searchActiveByKeyOrDescription(@Param("searchText") String searchText);

    /**
     * Verifica si existe una propiedad con la clave especificada
     */
    boolean existsByKey(String key);

    /**
     * Cuenta propiedades por categoría
     */
    @Query("SELECT COUNT(c) FROM ConfigurationProperty c WHERE c.category = :category")
    long countByCategory(@Param("category") String category);

    /**
     * Obtiene todas las propiedades sensibles
     */
    @Query("SELECT c FROM ConfigurationProperty c WHERE c.isSensitive = true ORDER BY c.category, c.key")
    List<ConfigurationProperty> findAllSensitive();

    /**
     * Obtiene propiedades editables
     */
    @Query("SELECT c FROM ConfigurationProperty c WHERE c.isEditable = true ORDER BY c.category, c.key")
    List<ConfigurationProperty> findAllEditable();
}