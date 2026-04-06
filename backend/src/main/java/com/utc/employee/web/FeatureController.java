package com.utc.employee.web;

import com.utc.employee.repo.FeatureRepository;
import com.utc.employee.web.dto.FeatureOptionDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/features")
public class FeatureController {

    private final FeatureRepository featureRepository;

    public FeatureController(FeatureRepository featureRepository) {
        this.featureRepository = featureRepository;
    }

    @GetMapping
    public List<FeatureOptionDto> list() {
        return featureRepository.findAll().stream()
                .map(f -> new FeatureOptionDto(f.getCode(), f.getName()))
                .toList();
    }
}
