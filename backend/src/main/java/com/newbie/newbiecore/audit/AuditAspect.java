package com.newbie.newbiecore.audit;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.stereotype.Component;

/**
 * Aspect para auditar automáticamente operaciones en los servicios.
 * Intercepta métodos específicos para registrar acciones en el log de
 * auditoría.
 */
@Aspect
@Component
public class AuditAspect {

    private final AuditService auditService;

    public AuditAspect(AuditService auditService) {
        this.auditService = auditService;
    }

    /**
     * Auditar creación de órdenes de trabajo
     */
    @AfterReturning(pointcut = "execution(* com.newbie.newbiecore.service.OrdenTrabajoService.crearOrden(..))", returning = "resultado")
    public void auditarCreacionOrden(JoinPoint joinPoint, Object resultado) {
        try {
            if (resultado != null) {
                String numeroOrden = obtenerNumeroOrden(resultado);
                auditService.registrar(TipoAccion.OT_CREADA, "OrdenTrabajo", numeroOrden,
                        "Orden de trabajo creada");
            }
        } catch (Exception e) {
            System.err.println("Error en auditoría de creación OT: " + e.getMessage());
        }
    }

    /**
     * Auditar cambios de estado en órdenes
     */
    @AfterReturning(pointcut = "execution(* com.newbie.newbiecore.service.OrdenTrabajoService.actualizarEntrega(..))", returning = "resultado")
    public void auditarActualizacionOrden(JoinPoint joinPoint, Object resultado) {
        try {
            Object[] args = joinPoint.getArgs();
            if (args.length > 0) {
                Long ordenId = (Long) args[0];
                auditService.registrar(TipoAccion.ACTUALIZAR, "OrdenTrabajo",
                        ordenId.toString(), "Orden de trabajo actualizada");
            }
        } catch (Exception e) {
            System.err.println("Error en auditoría de actualización OT: " + e.getMessage());
        }
    }

    /**
     * Auditar creación de fichas técnicas
     */
    @AfterReturning(pointcut = "execution(* com.newbie.newbiecore.service.FichaTecnicaService.crear*(..))", returning = "resultado")
    public void auditarCreacionFicha(JoinPoint joinPoint, Object resultado) {
        try {
            if (resultado != null) {
                String id = obtenerIdEntidad(resultado);
                auditService.registrar(TipoAccion.FICHA_CREADA, "FichaTecnica", id,
                        "Ficha técnica creada");
            }
        } catch (Exception e) {
            System.err.println("Error en auditoría de creación ficha: " + e.getMessage());
        }
    }

    /**
     * Auditar actualización de fichas técnicas
     */
    @AfterReturning(pointcut = "execution(* com.newbie.newbiecore.service.FichaTecnicaService.actualizar*(..))", returning = "resultado")
    public void auditarActualizacionFicha(JoinPoint joinPoint, Object resultado) {
        try {
            if (resultado != null) {
                String id = obtenerIdEntidad(resultado);
                auditService.registrar(TipoAccion.FICHA_ACTUALIZADA, "FichaTecnica", id,
                        "Ficha técnica actualizada");
            }
        } catch (Exception e) {
            System.err.println("Error en auditoría de actualización ficha: " + e.getMessage());
        }
    }

    /**
     * Auditar creación de usuarios
     */
    @AfterReturning(pointcut = "execution(* com.newbie.newbiecore.service.UsuarioService.crear*(..))", returning = "resultado")
    public void auditarCreacionUsuario(JoinPoint joinPoint, Object resultado) {
        try {
            if (resultado != null) {
                String cedula = obtenerCedulaUsuario(resultado);
                auditService.registrar(TipoAccion.USUARIO_CREADO, "Usuario", cedula,
                        "Usuario creado en el sistema");
            }
        } catch (Exception e) {
            System.err.println("Error en auditoría de creación usuario: " + e.getMessage());
        }
    }

    /**
     * Auditar modificación de usuarios
     */
    @AfterReturning(pointcut = "execution(* com.newbie.newbiecore.service.UsuarioService.actualizar*(..))", returning = "resultado")
    public void auditarModificacionUsuario(JoinPoint joinPoint, Object resultado) {
        try {
            if (resultado != null) {
                String cedula = obtenerCedulaUsuario(resultado);
                auditService.registrar(TipoAccion.USUARIO_MODIFICADO, "Usuario", cedula,
                        "Usuario modificado");
            }
        } catch (Exception e) {
            System.err.println("Error en auditoría de modificación usuario: " + e.getMessage());
        }
    }

    /**
     * Auditar cambios de configuración
     */
    @AfterReturning(pointcut = "execution(* com.newbie.newbiecore.service.ConfigurationService.set*(..))")
    public void auditarCambioConfiguracion(JoinPoint joinPoint) {
        try {
            Object[] args = joinPoint.getArgs();
            if (args.length >= 2) {
                String clave = args[0].toString();
                String valor = args[1].toString();
                auditService.registrarCambioConfiguracion(clave, null, valor);
            }
        } catch (Exception e) {
            System.err.println("Error en auditoría de configuración: " + e.getMessage());
        }
    }

    /**
     * Auditar subida de imágenes
     */
    @AfterReturning(pointcut = "execution(* com.newbie.newbiecore.service.OrdenTrabajoImagenService.subirImagenes(..))", returning = "resultado")
    public void auditarSubidaImagenes(JoinPoint joinPoint, Object resultado) {
        try {
            Object[] args = joinPoint.getArgs();
            if (args.length > 0) {
                Long ordenId = (Long) args[0];
                auditService.registrar(TipoAccion.IMAGEN_SUBIDA, "OrdenTrabajo",
                        ordenId.toString(), "Imágenes subidas a la orden");
            }
        } catch (Exception e) {
            System.err.println("Error en auditoría de imágenes: " + e.getMessage());
        }
    }

    /**
     * Auditar creación de ítems de catálogo
     */
    @AfterReturning(pointcut = "execution(* com.newbie.newbiecore.service.CatalogoService.crear*(..))", returning = "resultado")
    public void auditarCreacionCatalogo(JoinPoint joinPoint, Object resultado) {
        try {
            if (resultado != null) {
                String id = obtenerIdEntidad(resultado);
                auditService.registrar(TipoAccion.ITEM_CATALOGO_CREADO, "CatalogoItem", id,
                        "Item de catálogo creado");
            }
        } catch (Exception e) {
            System.err.println("Error en auditoría de catálogo: " + e.getMessage());
        }
    }

    /**
     * Auditar agregado de costos a orden
     */
    @AfterReturning(pointcut = "execution(* com.newbie.newbiecore.service.OrdenTrabajoCostoService.agregar*(..))", returning = "resultado")
    public void auditarAgregadoCosto(JoinPoint joinPoint, Object resultado) {
        try {
            Object[] args = joinPoint.getArgs();
            if (args.length > 0) {
                Long ordenId = (Long) args[0];
                auditService.registrar(TipoAccion.COSTO_AGREGADO, "OrdenTrabajoCosto",
                        ordenId.toString(), "Costo agregado a la orden");
            }
        } catch (Exception e) {
            System.err.println("Error en auditoría de costo: " + e.getMessage());
        }
    }

    // ============ MÉTODOS AUXILIARES ============

    private String obtenerNumeroOrden(Object obj) {
        try {
            java.lang.reflect.Method method = obj.getClass().getMethod("getNumeroOrden");
            Object result = method.invoke(obj);
            return result != null ? result.toString() : "N/A";
        } catch (Exception e) {
            return "N/A";
        }
    }

    private String obtenerIdEntidad(Object obj) {
        try {
            java.lang.reflect.Method method = obj.getClass().getMethod("getId");
            Object result = method.invoke(obj);
            return result != null ? result.toString() : "N/A";
        } catch (Exception e) {
            return "N/A";
        }
    }

    private String obtenerCedulaUsuario(Object obj) {
        try {
            java.lang.reflect.Method method = obj.getClass().getMethod("getCedula");
            Object result = method.invoke(obj);
            return result != null ? result.toString() : "N/A";
        } catch (Exception e) {
            return "N/A";
        }
    }
}
