package com.procost.api.dto;

public class JwtResponse {
    private Long id;
    private String username;
    private boolean isAdmin;
    private String token;

    public JwtResponse(Long id, String username, boolean isAdmin, String token) {
        this.id = id;
        this.username = username;
        this.isAdmin = isAdmin;
        this.token = token;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public boolean isAdmin() {
        return isAdmin;
    }

    public void setAdmin(boolean admin) {
        isAdmin = admin;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}