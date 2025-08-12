package com.procost.api.service;

import com.procost.api.model.*;
import com.procost.api.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
public class DemoDataService {

    @Autowired
    private EmailEnquiryRepository emailEnquiryRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private EnquiryItemRepository enquiryItemRepository;

    @Transactional
    public void populateDemoData() {
        if (emailEnquiryRepository.count() > 0) {
            return; // Data already exists
        }

        // Create demo customers
        Customer customer1 = createCustomer("Nordic Seafood AS", "purchasing@nordic-seafood.no", "Norway", "PREMIUM");
        Customer customer2 = createCustomer("Atlantic Foods Ltd", "procurement@atlanticfoods.com", "United Kingdom", "STANDARD");
        Customer customer3 = createCustomer("Mediterranean Fish Co", "orders@medfish.es", "Spain", "PREMIUM");

        // Create demo enquiries
        createDemoEnquiry1(customer1);
        createDemoEnquiry2(customer2);
        createDemoEnquiry3(customer3);
    }

    private Customer createCustomer(String company, String email, String country, String tier) {
        Customer customer = new Customer();
        customer.setCompanyName(company);
        customer.setEmail(email);
        customer.setContactPerson(extractNameFromEmail(email));
        customer.setCountry(country);
        customer.setPhone("+1-555-" + (int)(Math.random() * 9000 + 1000));
        return customerRepository.save(customer);
    }

    private String extractNameFromEmail(String email) {
        String localPart = email.split("@")[0];
        return localPart.substring(0, 1).toUpperCase() + localPart.substring(1).replace(".", " ");
    }

    private void createDemoEnquiry1(Customer customer) {
        EmailEnquiry enquiry = new EmailEnquiry();
        enquiry.setEnquiryId("ENQ-2024-001");
        enquiry.setFromEmail(customer.getEmail());
        enquiry.setSubject("Urgent Quote Request - Premium Salmon Fillets for Q1 2025");
        enquiry.setEmailBody("Dear Procurement Team,\n\n" +
            "We need an urgent quote for our Q1 2025 requirements:\n\n" +
            "1. Premium Atlantic Salmon Fillets - Trim A specification\n" +
            "   - Quantity: 5,000 kg\n" +
            "   - Packaging: 15 kg AIR boxes, EPS AIR packaging\n" +
            "   - Transport: Air freight to Oslo\n" +
            "   - Delivery: January 15, 2025\n\n" +
            "2. Salmon Portions - Trim B specification\n" +
            "   - Quantity: 2,500 kg\n" +
            "   - Packaging: Vacuum packed, Foil 3-4\n" +
            "   - Transport: Regular shipping\n" +
            "   - Delivery: February 1, 2025\n\n" +
            "Please provide competitive pricing and confirm delivery schedules.\n\n" +
            "Best regards,\nNordic Procurement Team");
        enquiry.setCustomer(customer);
        enquiry.setStatus(EnquiryStatus.PROCESSING);
        enquiry.setAiProcessed(true);
        enquiry.setProcessingNotes("AI-processed demo enquiry - High priority customer");
        enquiry.setProcessedAt(LocalDateTime.now().minusHours(2));
        enquiry.setReceivedAt(LocalDateTime.now().minusDays(1));
        enquiry.setMessageId("msg-001-" + System.currentTimeMillis());
        enquiry.setThreadId("thread-001-nordic");
        enquiry.setConversationId("conv-001-nordic");

        enquiry = emailEnquiryRepository.save(enquiry);

        // Create enquiry items
        createEnquiryItem(enquiry, "Salmon", "Trim A", "2-3 kg", "Fresh", "EPS AIR", "15 kg AIR", "Air", 5000, "January 15, 2025", "Premium Atlantic Salmon Fillets for restaurant chain", "HIGH");
        createEnquiryItem(enquiry, "Salmon", "Trim B", "3-4 kg", "Frozen", "Foil 3-4", "VAC", "Regular", 2500, "February 1, 2025", "Salmon portions for retail distribution", "HIGH");
    }

    private void createDemoEnquiry2(Customer customer) {
        EmailEnquiry enquiry = new EmailEnquiry();
        enquiry.setEnquiryId("ENQ-2024-002");
        enquiry.setFromEmail(customer.getEmail());
        enquiry.setSubject("Bulk Order Enquiry - Mixed Seafood Products");
        enquiry.setEmailBody("Hello,\n\n" +
            "We are planning a large procurement for our European distribution network.\n" +
            "Please quote for the following:\n\n" +
            "- Cod Fillets: 8,000 kg, Trim C, standard processing\n" +
            "- Packaging: 20 kg boxes, Solid Box packaging\n" +
            "- Transport: Sea freight to Portsmouth\n" +
            "- Delivery window: March 1-15, 2025\n\n" +
            "Also need pricing for value-added portions if available.\n\n" +
            "Regards,\nAtlantic Procurement");
        enquiry.setCustomer(customer);
        enquiry.setStatus(EnquiryStatus.QUOTED);
        enquiry.setAiProcessed(true);
        enquiry.setProcessingNotes("AI-processed demo enquiry - Large volume order");
        enquiry.setProcessedAt(LocalDateTime.now().minusDays(3));
        enquiry.setReceivedAt(LocalDateTime.now().minusDays(4));
        enquiry.setMessageId("msg-002-" + System.currentTimeMillis());
        enquiry.setThreadId("thread-002-atlantic");
        enquiry.setConversationId("conv-002-atlantic");

        enquiry = emailEnquiryRepository.save(enquiry);

        createEnquiryItem(enquiry, "Cod", "Trim C", "4-5 kg", "Frozen", "Solid Box", "20 kg", "Regular", 8000, "March 1-15, 2025", "Bulk cod fillets for European distribution", "MEDIUM");
    }

    private void createDemoEnquiry3(Customer customer) {
        EmailEnquiry enquiry = new EmailEnquiry();
        enquiry.setEnquiryId("ENQ-2024-003");
        enquiry.setFromEmail(customer.getEmail());
        enquiry.setSubject("Weekly Supply Contract - Fresh Mediterranean Range");
        enquiry.setEmailBody("Buenos días,\n\n" +
            "We need to establish a weekly supply contract for our Mediterranean restaurants:\n\n" +
            "1. Sea Bass Fillets - Premium grade\n" +
            "   - Weekly volume: 500 kg\n" +
            "   - Packaging: 10 kg EPS boxes\n" +
            "   - Fresh, never frozen requirement\n\n" +
            "2. Dorado Portions - Restaurant cuts\n" +
            "   - Weekly volume: 300 kg\n" +
            "   - Packaging: 5 kg Corrugated boxes\n" +
            "   - Vacuum packed preferred\n\n" +
            "Contract duration: 12 months\n" +
            "Delivery: Every Tuesday to Barcelona\n\n" +
            "Please include volume discounts in your proposal.\n\n" +
            "Saludos,\nMediterranean Fish Co");
        enquiry.setCustomer(customer);
        enquiry.setStatus(EnquiryStatus.RECEIVED);
        enquiry.setAiProcessed(true);
        enquiry.setProcessingNotes("AI-processed demo enquiry - Contract opportunity");
        enquiry.setProcessedAt(LocalDateTime.now().minusDays(1));
        enquiry.setReceivedAt(LocalDateTime.now().minusDays(1));
        enquiry.setMessageId("msg-003-" + System.currentTimeMillis());
        enquiry.setThreadId("thread-003-med");
        enquiry.setConversationId("conv-003-med");

        enquiry = emailEnquiryRepository.save(enquiry);

        createEnquiryItem(enquiry, "Sea Bass", "Trim A", "1-2 kg", "Fresh", "EPS", "10 kg", "Regular", 500, "Weekly delivery - Tuesdays", "Premium sea bass fillets for restaurant service", "HIGH");
        createEnquiryItem(enquiry, "Dorado", "Trim B", "2-3 kg", "Fresh", "Corrugated Box", "5 kg", "Regular", 300, "Weekly delivery - Tuesdays", "Restaurant portion cuts, vacuum packed", "MEDIUM");
    }

    private void createEnquiryItem(EmailEnquiry enquiry, String product, String trimType, String rmSpec, String productType, 
                                 String packagingType, String boxQuantity, String transportMode, int quantity, 
                                 String deliveryReq, String description, String confidence) {
        EnquiryItem item = new EnquiryItem();
        item.setEmailEnquiry(enquiry);
        item.setProduct(product);
        item.setTrimType(trimType);
        item.setRmSpec(rmSpec);
        item.setProductType(productType);
        item.setPackagingType(packagingType);
        item.setBoxQuantity(boxQuantity);
        item.setTransportMode(transportMode);
        item.setRequestedQuantity(quantity);
        item.setDeliveryRequirement(deliveryReq);
        item.setProductDescription(description);
        item.setSpecialInstructions("Standard processing requirements");
        item.setAiMapped(true);
        item.setMappingConfidence(confidence);
        item.setAiProcessingNotes("Extracted via AI demo processing");
        item.setProcessedAt(LocalDateTime.now());
        item.setCurrency("USD");
        
        // Set realistic pricing
        item.setUnitPrice(calculateDemoPrice(product, trimType, productType));
        item.setTotalPrice(item.getUnitPrice() * quantity);
        
        enquiryItemRepository.save(item);
    }

    private Double calculateDemoPrice(String product, String trimType, String productType) {
        double basePrice = 8.50; // Base price per kg
        
        // Product premium
        switch (product.toLowerCase()) {
            case "salmon": basePrice += 3.50; break;
            case "sea bass": basePrice += 4.20; break;
            case "dorado": basePrice += 3.80; break;
            case "cod": basePrice += 1.50; break;
            default: basePrice += 1.00; break;
        }
        
        // Trim premium
        switch (trimType) {
            case "Trim A": basePrice += 2.00; break;
            case "Trim B": basePrice += 1.20; break;
            case "Trim C": basePrice += 0.50; break;
        }
        
        // Fresh premium
        if ("Fresh".equals(productType)) {
            basePrice += 1.50;
        }
        
        return Math.round(basePrice * 100.0) / 100.0; // Round to 2 decimal places
    }
} 