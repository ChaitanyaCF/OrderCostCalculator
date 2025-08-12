package com.procost.api.service;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.regex.Pattern;

@Service
public class EmailContentProcessor {
    
    private static final Logger logger = LoggerFactory.getLogger(EmailContentProcessor.class);
    
    /**
     * Process email content - handles both HTML and plain text
     */
    public String processEmailContent(String emailBody) {
        if (emailBody == null || emailBody.trim().isEmpty()) {
            return "";
        }
        
        // Check if content is HTML
        if (isHtmlContent(emailBody)) {
            logger.info("Processing HTML email content");
            return convertHtmlToText(emailBody);
        } else {
            logger.info("Processing plain text email content");
            return cleanPlainText(emailBody);
        }
    }
    
    /**
     * Check if content is HTML
     */
    private boolean isHtmlContent(String content) {
        // Look for HTML tags
        return content.contains("<html") || 
               content.contains("<body") || 
               content.contains("<div") || 
               content.contains("<p>") ||
               content.contains("&nbsp;") ||
               content.contains("&amp;") ||
               Pattern.compile("<[^>]+>").matcher(content).find();
    }
    
    /**
     * Convert HTML email to clean text while preserving structure
     */
    private String convertHtmlToText(String htmlContent) {
        try {
            // Parse HTML
            Document doc = Jsoup.parse(htmlContent);
            
            // Remove script and style elements
            doc.select("script, style").remove();
            
            // Convert common HTML elements to text with formatting
            Elements paragraphs = doc.select("p");
            for (Element p : paragraphs) {
                p.after("\n\n");
            }
            
            Elements lineBreaks = doc.select("br");
            for (Element br : lineBreaks) {
                br.after("\n");
            }
            
            Elements divs = doc.select("div");
            for (Element div : divs) {
                div.after("\n");
            }
            
            // Handle lists
            Elements listItems = doc.select("li");
            for (Element li : listItems) {
                li.prepend("• ");
                li.after("\n");
            }
            
            // Handle tables
            Elements tableRows = doc.select("tr");
            for (Element tr : tableRows) {
                tr.after("\n");
            }
            
            Elements tableCells = doc.select("td, th");
            for (Element cell : tableCells) {
                cell.after(" | ");
            }
            
            // Get clean text
            String text = doc.text();
            
            // Clean up extra whitespace and line breaks
            text = text.replaceAll("\\n\\s*\\n\\s*\\n", "\n\n"); // Multiple line breaks to double
            text = text.replaceAll("[ \\t]+", " "); // Multiple spaces to single
            text = text.trim();
            
            logger.info("Converted HTML email to text, original length: {}, processed length: {}", 
                       htmlContent.length(), text.length());
            
            return text;
            
        } catch (Exception e) {
            logger.error("Error processing HTML email content: {}", e.getMessage());
            // Fallback to basic HTML tag removal
            return cleanPlainText(removeHtmlTags(htmlContent));
        }
    }
    
    /**
     * Clean plain text content
     */
    private String cleanPlainText(String text) {
        if (text == null) return "";
        
        // Replace various line break formats
        text = text.replaceAll("\\r\\n", "\n");
        text = text.replaceAll("\\r", "\n");
        
        // Clean up extra whitespace
        text = text.replaceAll("\\n\\s*\\n\\s*\\n", "\n\n");
        text = text.replaceAll("[ \\t]+", " ");
        
        // Decode common HTML entities that might appear in plain text
        text = text.replace("&nbsp;", " ");
        text = text.replace("&amp;", "&");
        text = text.replace("&lt;", "<");
        text = text.replace("&gt;", ">");
        text = text.replace("&quot;", "\"");
        
        return text.trim();
    }
    
    /**
     * Basic HTML tag removal as fallback
     */
    private String removeHtmlTags(String html) {
        if (html == null) return "";
        return html.replaceAll("<[^>]+>", "").trim();
    }
    
    /**
     * Extract email signature (for better customer info extraction)
     */
    public String extractEmailSignature(String emailContent) {
        String[] lines = emailContent.split("\n");
        StringBuilder signature = new StringBuilder();
        boolean inSignature = false;
        
        // Look for signature indicators
        String[] signatureKeywords = {
            "best regards", "regards", "sincerely", "kind regards",
            "thank you", "thanks", "br,", "rgds"
        };
        
        for (int i = 0; i < lines.length; i++) {
            String line = lines[i].toLowerCase().trim();
            
            // Check if this line starts a signature
            for (String keyword : signatureKeywords) {
                if (line.contains(keyword)) {
                    inSignature = true;
                    break;
                }
            }
            
            // If we're in signature area, collect remaining lines
            if (inSignature) {
                signature.append(lines[i]).append("\n");
            }
        }
        
        return signature.toString().trim();
    }
    
    /**
     * Extract main email body (excluding signature and headers)
     */
    public String extractMainEmailBody(String emailContent) {
        // Remove email signature
        String signature = extractEmailSignature(emailContent);
        String mainBody = emailContent;
        
        if (!signature.isEmpty()) {
            mainBody = emailContent.replace(signature, "").trim();
        }
        
        // Remove common email headers that might appear in forwarded emails
        String[] headerPatterns = {
            "From:.*\n", "To:.*\n", "Subject:.*\n", "Date:.*\n",
            "Sent:.*\n", "Received:.*\n"
        };
        
        for (String pattern : headerPatterns) {
            mainBody = mainBody.replaceAll(pattern, "");
        }
        
        return mainBody.trim();
    }
} 