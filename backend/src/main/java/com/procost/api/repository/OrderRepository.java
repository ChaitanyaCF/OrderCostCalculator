package com.procost.api.repository;

import com.procost.api.model.Order;
import com.procost.api.model.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    /**
     * Find order by order number
     */
    Optional<Order> findByOrderNumber(String orderNumber);
    
    /**
     * Find orders by status
     */
    List<Order> findByStatus(OrderStatus status);
    
    /**
     * Find orders created after a specific date
     */
    Page<Order> findByOrderDateAfter(LocalDateTime date, Pageable pageable);
    
    /**
     * Find orders by customer email
     */
    List<Order> findByCustomerEmail(String email);
    
    /**
     * Count orders by status
     */
    long countByStatus(OrderStatus status);
    
    /**
     * Find recent orders
     */
    List<Order> findTop10ByOrderByOrderDateDesc();
}
