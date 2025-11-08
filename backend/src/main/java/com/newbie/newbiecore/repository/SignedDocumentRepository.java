package com.newbie.newbiecore.repository;

import com.newbie.newbiecore.entity.SignedDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface SignedDocumentRepository extends JpaRepository<SignedDocument, UUID> {
}
