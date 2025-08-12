package com.procost.api.repository;

import com.procost.api.model.Email;
import com.procost.api.model.Email.EmailClassification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmailRepository extends JpaRepository<Email, Long> {
    
    // Find all emails ordered by received date (newest first)
    List<Email> findAllByOrderByReceivedAtDesc();
    
    // Find emails by classification
    List<Email> findByClassification(EmailClassification classification);
    
    // Find emails by manual classification
    List<Email> findByManualClassification(EmailClassification manualClassification);
    
    // Find unprocessed emails
    List<Email> findByProcessedFalse();
    
    // Find emails by sender
    List<Email> findByFromEmailOrderByReceivedAtDesc(String fromEmail);
    
    // Find emails that need manual classification (no manual override and AI classification failed or is GENERAL/UNCLASSIFIED)
    @Query("SELECT e FROM Email e WHERE e.manualClassification IS NULL AND (e.classification IS NULL OR e.classification IN ('GENERAL', 'UNCLASSIFIED')) ORDER BY e.receivedAt DESC")
    List<Email> findEmailsNeedingClassification();
    
    // Find emails with effective classification (manual takes precedence over AI)
    @Query("SELECT e FROM Email e WHERE " +
           "(e.manualClassification IS NOT NULL AND e.manualClassification = :classification) OR " +
           "(e.manualClassification IS NULL AND e.classification = :classification) " +
           "ORDER BY e.receivedAt DESC")
    List<Email> findByEffectiveClassification(@Param("classification") EmailClassification classification);
    
    // Count emails by classification status
    @Query("SELECT COUNT(e) FROM Email e WHERE e.manualClassification IS NULL AND (e.classification IS NULL OR e.classification IN ('GENERAL', 'UNCLASSIFIED'))")
    long countEmailsNeedingClassification();
}