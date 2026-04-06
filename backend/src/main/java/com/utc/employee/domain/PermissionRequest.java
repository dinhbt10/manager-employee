package com.utc.employee.domain;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "permission_requests")
public class PermissionRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 32)
    private String code;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(length = 4000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RequestStatus status = RequestStatus.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private UserAccount requester;

    /** Nhân viên được cấp quyền (có thể chính người tạo request) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_user_id", nullable = false)
    private UserAccount targetUser;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "request_requested_features",
            joinColumns = @JoinColumn(name = "request_id"),
            inverseJoinColumns = @JoinColumn(name = "feature_id")
    )
    private Set<Feature> requestedFeatures = new HashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id")
    private UserAccount reviewer;

    private Instant reviewedAt;

    @Column(length = 500)
    private String rejectReason;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    private Instant updatedAt = Instant.now();

    public Long getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public RequestStatus getStatus() {
        return status;
    }

    public void setStatus(RequestStatus status) {
        this.status = status;
    }

    public UserAccount getRequester() {
        return requester;
    }

    public void setRequester(UserAccount requester) {
        this.requester = requester;
    }

    public UserAccount getTargetUser() {
        return targetUser;
    }

    public void setTargetUser(UserAccount targetUser) {
        this.targetUser = targetUser;
    }

    public Set<Feature> getRequestedFeatures() {
        return requestedFeatures;
    }

    public void setRequestedFeatures(Set<Feature> requestedFeatures) {
        this.requestedFeatures = requestedFeatures;
    }

    public UserAccount getReviewer() {
        return reviewer;
    }

    public void setReviewer(UserAccount reviewer) {
        this.reviewer = reviewer;
    }

    public Instant getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(Instant reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    public String getRejectReason() {
        return rejectReason;
    }

    public void setRejectReason(String rejectReason) {
        this.rejectReason = rejectReason;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
