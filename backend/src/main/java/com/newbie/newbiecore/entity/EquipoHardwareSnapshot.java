
package com.newbie.newbiecore.entity;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Table(name = "equipo_hardware_snapshots")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EquipoHardwareSnapshot {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "equipo_id")
    private Equipo equipo;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "uploaded_by")
    private String uploadedBy;

    @Column(name = "file_name")
    private String fileName;

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;

    @Column(name = "xml_sha256", length = 64)
    private String xmlSha256;

    @Column(name = "hostname")
    private String hostname;

    @Column(name = "cpu_name")
    private String cpuName;

    @Column(name = "bios_version")
    private String biosVersion;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "snapshot_json", columnDefinition = "jsonb", nullable = false)
    private JsonNode snapshotJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "diff_prev_json", columnDefinition = "jsonb")
    private JsonNode diffPrevJson;
}
