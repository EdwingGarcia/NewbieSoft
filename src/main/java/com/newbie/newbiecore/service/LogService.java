package com.newbie.newbiecore.service;

import com.newbie.newbiecore.entity.Log;
import com.newbie.newbiecore.repository.LogRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class LogService {
    private final LogRepository logRepository;

    public LogService(LogRepository logRepository) {
        this.logRepository = logRepository;
    }

    public Log registrarLog(Log log) {
        return logRepository.save(log);
    }

    public List<Log> listarPorUsuario(Long usuarioId) {
        return logRepository.findByUsuario_IdUsuario(usuarioId);
    }
}
