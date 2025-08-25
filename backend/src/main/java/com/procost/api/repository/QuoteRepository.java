package com.procost.api.repository;

import com.procost.api.model.Quote;
import com.procost.api.model.QuoteStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface QuoteRepository extends JpaRepository<Quote, Long> {
    
    List<Quote> findByStatus(QuoteStatus status);
    
    List<Quote> findByCustomerId(Long customerId);
    
    @Query("SELECT q FROM Quote q WHERE q.createdAt >= ?1 ORDER BY q.createdAt DESC")
    List<Quote> findRecentQuotes(LocalDateTime since);
    
    long countByStatus(QuoteStatus status);
    
    // Additional methods for external API
    Optional<Quote> findByQuoteNumber(String quoteNumber);
    Page<Quote> findByCreatedAtAfter(LocalDateTime since, Pageable pageable);
} 