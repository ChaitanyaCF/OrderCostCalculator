package com.procost.api.repository;

import com.procost.api.model.Factory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FactoryRepository extends JpaRepository<Factory, Long> {
    
    // Find factory by name
    Factory findByName(String name);
    
    // Find factories by location
    java.util.List<Factory> findByLocation(String location);
} 