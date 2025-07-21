package com.procost.api.repository;

import com.procost.api.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    
    /**
     * Find customer by email address
     */
    Optional<Customer> findByEmail(String email);
    
    /**
     * Find customer by company name
     */
    Optional<Customer> findByCompanyName(String companyName);
    
    /**
     * Find customers by country
     */
    java.util.List<Customer> findByCountry(String country);
    
    /**
     * Check if customer exists by email
     */
    boolean existsByEmail(String email);
} 