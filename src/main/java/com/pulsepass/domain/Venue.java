package com.pulsepass.domain;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "venues")
public class Venue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String code;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(nullable = false, length = 200)
    private String address;

    @Column(nullable = false)
    private Integer capacity;

    @Column(nullable = false)
    private Boolean active;

    @OneToMany(mappedBy = "venue", fetch = FetchType.LAZY)
    private List<Event> events = new ArrayList<>();

    protected Venue() {
        // Requerido por JPA
    }

    public Venue(String code, String name, String city, String address, Integer capacity, Boolean active) {
        this.code = code;
        this.name = name;
        this.city = city;
        this.address = address;
        this.capacity = capacity;
        this.active = active;
    }

    public Long getId() { return id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }

    public List<Event> getEvents() { return events; }
}