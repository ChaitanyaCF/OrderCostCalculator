package com.procost.api.repository;

import com.procost.api.model.EnquiryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EnquiryItemRepository extends JpaRepository<EnquiryItem, Long> {
} 