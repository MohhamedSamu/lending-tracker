# 📋 Datos Necesarios para Nueva Cuenta de Ingrid Calderon

## ⚠️ RECORDATORIO: Necesitamos estos datos para crear la nueva cuenta

Para crear la nueva cuenta de **Ingrid Calderon** después de cambiar la cuenta de Pablo, necesitamos la siguiente información:

### 1. **Datos de Usuario:**
- ✅ **Email:** (correo electrónico de Ingrid Calderon)
- ✅ **Nombre completo:** Ingrid Calderon
- ✅ **Rol:** `borrower` (prestatario)
- ✅ **Contraseña inicial:** (se generará un hash bcrypt)

### 2. **Datos del Préstamo:**
- ✅ **Monto del préstamo:** (ejemplo: 37500.00)
- ✅ **Pago mensual mínimo:** (ejemplo: 300.00)
- ✅ **Fecha de inicio del préstamo:** (ejemplo: '2024-09-01')
- ✅ **Duración del préstamo en meses:** (ejemplo: 125 meses para 10 años y 5 meses)

### 3. **Ejemplo de SQL (una vez tengas los datos):**
```sql
-- Insertar nueva cuenta para Ingrid Calderon
INSERT INTO users (email, name, role, password_hash, loan_amount, monthly_payment, loan_start_date, loan_duration_months)
VALUES (
  'ingrid.calderon@email.com',  -- ⚠️ CAMBIAR: email real
  'Ingrid Calderon',
  'borrower',
  '$2a$12$...',  -- ⚠️ CAMBIAR: hash bcrypt de la contraseña
  37500.00,  -- ⚠️ CAMBIAR: monto del préstamo
  300.00,  -- ⚠️ CAMBIAR: pago mensual mínimo
  '2024-09-01',  -- ⚠️ CAMBIAR: fecha de inicio
  125  -- ⚠️ CAMBIAR: duración en meses
);
```

### 📝 Notas:
- El hash de la contraseña se generará con bcrypt (12 rounds)
- La fecha de inicio del préstamo debe ser la fecha en que comenzó el préstamo (probablemente septiembre 2024)
- La duración en meses se calcula: años × 12 + meses adicionales

---

**Una vez tengas todos estos datos, compártelos y crearemos el script SQL completo para insertar la nueva cuenta.**

