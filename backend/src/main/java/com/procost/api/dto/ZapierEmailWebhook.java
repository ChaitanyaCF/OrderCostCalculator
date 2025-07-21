package com.procost.api.dto;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import java.time.LocalDateTime;

public class ZapierEmailWebhook {
    
    @Email
    @NotBlank(message = "From email is required")
    private String fromEmail;
    
    @Email
    private String toEmail;
    
    @NotBlank(message = "Subject is required")
    @Size(max = 500)
    private String subject;
    
    @NotBlank(message = "Email body is required")
    private String emailBody;
    
    private String emailHtml;
    
    @Size(max = 255)
    private String messageId;
    
    private LocalDateTime receivedAt;
    
    // Zapier-specific fields
    private String threadId;
    private String conversationId;
    private String attachments;
    
    // Constructors
    public ZapierEmailWebhook() {}
    
    public ZapierEmailWebhook(String fromEmail, String subject, String emailBody) {
        this.fromEmail = fromEmail;
        this.subject = subject;
        this.emailBody = emailBody;
        this.receivedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public String getFromEmail() {
        return fromEmail;
    }
    
    public void setFromEmail(String fromEmail) {
        this.fromEmail = fromEmail;
    }
    
    public String getToEmail() {
        return toEmail;
    }
    
    public void setToEmail(String toEmail) {
        this.toEmail = toEmail;
    }
    
    public String getSubject() {
        return subject;
    }
    
    public void setSubject(String subject) {
        this.subject = subject;
    }
    
    public String getEmailBody() {
        return emailBody;
    }
    
    public void setEmailBody(String emailBody) {
        this.emailBody = emailBody;
    }
    
    public String getEmailHtml() {
        return emailHtml;
    }
    
    public void setEmailHtml(String emailHtml) {
        this.emailHtml = emailHtml;
    }
    
    public String getMessageId() {
        return messageId;
    }
    
    public void setMessageId(String messageId) {
        this.messageId = messageId;
    }
    
    public LocalDateTime getReceivedAt() {
        return receivedAt;
    }
    
    public void setReceivedAt(LocalDateTime receivedAt) {
        this.receivedAt = receivedAt;
    }
    
    public String getThreadId() {
        return threadId;
    }
    
    public void setThreadId(String threadId) {
        this.threadId = threadId;
    }
    
    public String getConversationId() {
        return conversationId;
    }
    
    public void setConversationId(String conversationId) {
        this.conversationId = conversationId;
    }
    
    public String getAttachments() {
        return attachments;
    }
    
    public void setAttachments(String attachments) {
        this.attachments = attachments;
    }
    
    @Override
    public String toString() {
        return "ZapierEmailWebhook{" +
                "fromEmail='" + fromEmail + '\'' +
                ", subject='" + subject + '\'' +
                ", receivedAt=" + receivedAt +
                '}';
    }
} 