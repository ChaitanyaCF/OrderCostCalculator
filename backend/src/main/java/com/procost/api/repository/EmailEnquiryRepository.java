package com.procost.api.repository;

import com.procost.api.model.EmailEnquiry;
import com.procost.api.model.EnquiryStatus;
import com.procost.api.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface EmailEnquiryRepository extends JpaRepository<EmailEnquiry, Long> {
    
    // Find by enquiry ID
    Optional<EmailEnquiry> findByEnquiryId(String enquiryId);
    
    // Find all enquiries sorted by received date (latest first)
    List<EmailEnquiry> findAllByOrderByReceivedAtDesc();
    
    // Find by email thread ID for tracking conversations
    List<EmailEnquiry> findByOriginalEmailIdOrderByReceivedAtDesc(String originalEmailId);
    
    // Find by customer
    List<EmailEnquiry> findByCustomerIdOrderByReceivedAtDesc(Long customerId);
    
    // Find by status
    List<EmailEnquiry> findByStatusOrderByReceivedAtDesc(EnquiryStatus status);
    
    // Find recent enquiries
    @Query("SELECT e FROM EmailEnquiry e WHERE e.receivedAt >= :since ORDER BY e.receivedAt DESC")
    List<EmailEnquiry> findRecentEnquiries(@Param("since") LocalDateTime since);
    
    // Find enquiries by email address
    List<EmailEnquiry> findByFromEmailOrderByReceivedAtDesc(String fromEmail);
    
    // Count by status
    long countByStatus(EnquiryStatus status);
    
    // Count by customer
    long countByCustomer(Customer customer);
    
    // Find unprocessed enquiries
    List<EmailEnquiry> findByAiProcessedFalseOrderByReceivedAtAsc();
    
    // Additional methods for external API
    Page<EmailEnquiry> findByStatusAndCreatedAtAfterAndCustomerEmailContaining(EnquiryStatus status, LocalDateTime since, String customerEmail, Pageable pageable);
    Page<EmailEnquiry> findByStatusAndCreatedAtAfter(EnquiryStatus status, LocalDateTime since, Pageable pageable);
    Page<EmailEnquiry> findByStatus(EnquiryStatus status, Pageable pageable);
    Page<EmailEnquiry> findByCreatedAtAfter(LocalDateTime since, Pageable pageable);
    Page<EmailEnquiry> findByCustomerEmailContaining(String customerEmail, Pageable pageable);
} 