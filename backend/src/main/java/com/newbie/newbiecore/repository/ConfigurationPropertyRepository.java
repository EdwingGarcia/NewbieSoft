package com.newbie.newbiecore.repository;

import com.newbie.newbiecore.entity.ConfigurationProperty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConfigurationPropertyRepository extends JpaRepository<ConfigurationProperty, Long> {

    Optional<ConfigurationProperty> findByKey(String key);

    List<ConfigurationProperty> findByCategory(String category);

    List<ConfigurationProperty> findByCategoryOrderByKeyAsc(String category);

    @Query("SELECT DISTINCT c.category FROM ConfigurationProperty c ORDER BY c.category")
    List<String> findAllCategories();

    @Query("SELECT c FROM ConfigurationProperty c WHERE c.isEditable = true ORDER BY c.category, c.key")
    List<ConfigurationProperty> findAllEditable();

    @Query("SELECT c FROM ConfigurationProperty c ORDER BY c.category, c.key")
    List<ConfigurationProperty> findAllOrderByCategoryAndKey();

    @Query("SELECT c FROM ConfigurationProperty c WHERE LOWER(c.key) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(c.description) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "ORDER BY c.category, c.key")
    List<ConfigurationProperty> searchByKeyOrDescription(@Param("search") String search);

    boolean existsByKey(String key);
}