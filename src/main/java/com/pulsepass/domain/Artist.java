package com.pulsepass.domain;

import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "artists")
public class Artist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "stage_name", nullable = false, unique = true, length = 120)
    private String stageName;

    @Column(length = 80)
    private String country;

    @Column(length = 80)
    private String genre;

    @Column(nullable = false)
    private Boolean active;

    @ManyToMany(mappedBy = "artists")
    private Set<Event> events = new HashSet<>();

    protected Artist() {
        // Requerido por JPA
    }

    public Artist(String stageName, String country, String genre, Boolean active) {
        this.stageName = stageName;
        this.country = country;
        this.genre = genre;
        this.active = active;
    }

    public Long getId() { return id; }

    public String getStageName() { return stageName; }
    public void setStageName(String stageName) { this.stageName = stageName; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getGenre() { return genre; }
    public void setGenre(String genre) { this.genre = genre; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }

    public Set<Event> getEvents() { return events; }
}