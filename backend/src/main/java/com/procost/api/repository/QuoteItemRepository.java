package com.procost.api.repository;

import com.procost.api.model.QuoteItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QuoteItemRepository extends JpaRepository<QuoteItem, Long> {
} 