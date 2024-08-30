const mysql = require('mysql2/promise');
const express = require('express');
const bp = require('body-parser');
const moment = require('moment-timezone');


var app = express();
app.use(bp.json());


const pool = mysql.createPool({

     host:'srv1059.hstgr.io',
    user:'u729991132_root',
    password:'Dragonb@ll2',
    database:'u729991132_railway',
    port:3306,
    multipleStatements: true
});


pool.getConnection()
    .then(connection => {
        console.log('Conexión establecida exitosamente.');
        connection.release();
    })
    .catch(err => {
        console.error('Error en la conexión a la base de datos:', err);
    

    if (!err) {
        console.log('Conexión Exitosa');
    } else {
        console.error('Error al conectar a la DB:', err.code, err.message, err.stack);
    }
});

app.listen(3000, () => console.log('API REST corriendo en el puerto: 3000'));


//http://localhost:3000/

//Select <-> Get ANUNCIOS  con Procedimiento almacenado
app.get('/SEL_ANUNCIOS_EVENTOS', async (req, res) => {
    try {
        const [rows, fields] = await pool.query('CALL SEL_TBL_ANUNCIOS_EVENTOS()');
        
        // Asumiendo que tu zona horaria deseada es America/Tegucigalpa
        const timezone = 'America/Tegucigalpa';
        const convertedRows = rows[0].map(row => {
            if (row.tuCampoDeFecha) {
                row.tuCampoDeFecha = moment.tz(row.FECHA_HORA, timezone).format();
            }
            return row;
        });

        res.status(200).json(convertedRows);
    } catch (err) {
        console.log(err);
        res.status(500).send('Error ejecutando la consulta.');
    }
});

// insertar a la tabla ANUNCIOS
app.post('/POST_ANUNCIOS_EVENTOS', async (req, res) => {
    const {
        P_TITULO,
        P_ID_ESTADO_ANUNCIO_EVENTO,
        P_DESCRIPCION,
        P_IMAGEN,
        P_FECHA_HORA
    } = req.body;

    try {
        const [rows, fields] = await pool.query("CALL INS_TBL_ANUNCIOS_EVENTOS (?,?,?,?,?)", [
            P_TITULO,
            P_ID_ESTADO_ANUNCIO_EVENTO,
            P_DESCRIPCION,
            P_IMAGEN,
            P_FECHA_HORA
        ]);
        
        res.send("Ingresado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).send('Error ejecutando la consulta.');
    }
});


//Delete de la tabla *** TIPO_PERSONAS ***
app.post('/DEL_ANUNCIOS_EVENTOS', async (req, res) => {
    const { P_ID_ANUNCIOS_EVENTOS } = req.body;

    try {
        const [rows, fields] = await pool.query("CALL DEL_TBL_ANUNCIOS_EVENTOS(?)", [P_ID_ANUNCIOS_EVENTOS]);
        
        res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
    } catch (err) {
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            res.status(400).json({
                error: 'No se puede eliminar el Anuncio porque está relacionado con otros registros.'
            });
        } else {
            res.status(500).json({
                error: 'Ocurrió un error al intentar eliminar el Anuncio.'
            });
        }
        console.log(err);
    }
});

app.post('/PUT_ANUNCIOS_EVENTOS', async (req, res) => {
    const {
        P_ID_ANUNCIOS_EVENTOS,
        P_ID_ESTADO_ANUNCIO_EVENTO,
        P_TITULO,
        P_DESCRIPCION,
        P_IMAGEN,
        P_FECHA_HORA,
    } = req.body;

    try {
        const [rows, fields] = await pool.query("CALL UPD_TBL_ANUNCIOS_EVENTOS (?,?,?,?,?,?)", [
            P_ID_ANUNCIOS_EVENTOS,
            P_ID_ESTADO_ANUNCIO_EVENTO,
            P_TITULO,
            P_DESCRIPCION,
            P_IMAGEN,
            P_FECHA_HORA,
        ]);

        res.send("Actualizado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).send('Error ejecutando la consulta.');
    }
});


//SELVIN 
//  ***TABLA PERSONA ***

// Select <-> Get PERSONAS con Procedimiento almacenado
app.get('/SEL_PERSONA', async (req, res) => {
    try {
        const [rows, fields] = await pool.query('CALL SEL_TBL_PERSONA()');
        res.status(200).json(rows[0]);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al obtener las personas.' });
    }
});

// Insertar a la tabla PERSONAS
app.post('/POST_PERSONA', async (req, res) => {
    const {
        P_NOMBRE_PERSONA,
        P_DNI_PERSONA,
        P_ID_CONTACTO,
        P_ID_TIPO_PERSONA,
        P_ID_ESTADO_PERSONA,
        P_ID_PARENTESCO,
        P_ID_CONDOMINIO,
        P_ID_PADRE,
    } = req.body;

    try {
        const [rows, fields] = await pool.query(
            "CALL INS_TBL_PERSONA(?,?,?,?,?,?,?,?)",
            [
                P_NOMBRE_PERSONA,
                P_DNI_PERSONA,
                P_ID_CONTACTO,
                P_ID_TIPO_PERSONA,
                P_ID_ESTADO_PERSONA,
                P_ID_PARENTESCO,
                P_ID_CONDOMINIO,
                P_ID_PADRE,
            ]
        );

        // Define el objeto `newPersona` con los datos de la persona recién creada
        const newPersona = {
            P_NOMBRE_PERSONA,
            P_DNI_PERSONA,
            P_ID_CONTACTO,
            P_ID_TIPO_PERSONA,
            P_ID_ESTADO_PERSONA,
            P_ID_PARENTESCO,
            P_ID_CONDOMINIO,
            P_ID_PADRE,
            ID_PERSONA: rows.insertId // O cualquier manera de obtener el ID_PERSONA creado
        };

        res.status(201).json(newPersona);  // Envía la respuesta con los detalles de la nueva persona
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al insertar la persona.' });
    }
});

// Delete a la tabla PERSONAS
app.post('/DEL_PERSONA', async (req, res) => {
    const { P_ID_PERSONA } = req.body;

    try {
        await pool.query("CALL DEL_TBL_PERSONA(?)", [P_ID_PERSONA]);
        res.status(200).json({ message: 'Residente eliminado con éxito.' });
    } catch (err) {
        console.log(err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') { // Código específico de error para FK
            res.status(400).json({
                error: 'No se puede eliminar el residente porque está relacionado con otros registros.'
            });
        } else {
            res.status(500).json({
                error: 'Ocurrió un error al intentar eliminar el residente.'
            });
        }
    }
});

// Actualizar a la tabla PERSONAS
app.post('/PUT_PERSONA', async (req, res) => {
    const {
        P_ID_PERSONA,
        P_NOMBRE_PERSONA,
        P_DNI_PERSONA,
        P_ID_CONTACTO,
        P_ID_TIPO_PERSONA,
        P_ID_ESTADO_PERSONA,
        P_ID_PARENTESCO,
        P_ID_CONDOMINIO,
        P_ID_PADRE
    } = req.body;

    try {
        await pool.query(
            "CALL UPD_TBL_PERSONA(?,?,?,?,?,?,?,?,?)",
            [
                P_ID_PERSONA,
                P_NOMBRE_PERSONA,
                P_DNI_PERSONA,
                P_ID_CONTACTO,
                P_ID_TIPO_PERSONA,
                P_ID_ESTADO_PERSONA,
                P_ID_PARENTESCO,
                P_ID_CONDOMINIO,
                P_ID_PADRE
            ]
        );

        res.send("Actualizado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al actualizar la persona.' });
    }
});


//Tablas *** TIPO_PERSONAS ***

// Select <-> Get TIPO_PERSONAS con Procedimiento almacenado
app.get('/SEL_TBL_TIPO_PERSONAS', async (req, res) => {
    try {
        const [rows, fields] = await pool.query('CALL SEL_TBL_TIPO_PERSONAS()');
        res.status(200).json(rows[0]);
    } catch (err) {
        console.log(err);
        res.status(500).send("Error ejecutando la consulta.");
    }
});

// Insertar a la tabla TIPO_PERSONAS
app.post('/POST_TBL_TIPO_PERSONAS', async (req, res) => {
    const { P_DESCRIPCION } = req.body;

    try {
        const [rows, fields] = await pool.query(
            "CALL INS_TBL_TIPO_PERSONAS(?)",
            [P_DESCRIPCION]
        );

        // Define el objeto `newTipoPersona` con los datos del tipo de persona recién creado
        const newTipoPersona = {
            P_DESCRIPCION,
            ID_TIPO_PERSONA: rows.insertId // O cualquier manera de obtener el ID_TIPO_PERSONA creado
        };

        res.status(201).json(newTipoPersona);  // Envía la respuesta con los detalles del nuevo tipo de persona
    } catch (err) {
        console.log(err);
        res.status(500).send("Error al ingresar los datos");
    }
});

// Delete de la tabla TIPO_PERSONAS
app.post('/DEL_TBL_TIPO_PERSONAS', async (req, res) => {
    const { P_ID_TIPO_PERSONA } = req.body;

    try {
        await pool.query(
            "CALL DEL_TBL_TIPO_PERSONAS(?)",
            [P_ID_TIPO_PERSONA]
        );

        res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
    } catch (err) {
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            res.status(400).json({
                error: 'No se puede eliminar el Tipo de Persona porque está relacionado con otros registros.'
            });
        } else {
            res.status(500).json({
                error: 'Ocurrió un error al intentar eliminar el Tipo de Persona.'
            });
        }
        console.log(err);
    }
});

// Actualizar a la tabla TIPO_PERSONAS
app.post('/PUT_TBL_TIPO_PERSONAS', async (req, res) => {
    const { P_ID_TIPO_PERSONA, P_DESCRIPCION } = req.body;

    try {
        await pool.query(
            "CALL UPD_TBL_TIPO_PERSONAS(?, ?)",
            [P_ID_TIPO_PERSONA, P_DESCRIPCION]
        );

        res.send("Actualizado correctamente !!");
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'El tipo de persona ya existe.' });
        }
        console.log(err);
        res.status(500).json({ message: 'Error al actualizar el tipo de persona.' });
    }
});



//  ***TABLA TBL_MS_ROLES ***

// Select <-> Get TBL_MS_ROLES con Procedimiento almacenado
app.get('/SEL_TBL_MS_ROLES', async (req, res) => {
    try {
        const [rows, fields] = await pool.query('CALL SEL_TBL_MS_ROLES()');
        res.status(200).json(rows[0]);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al obtener los roles.' });
    }
});

// Insertar a la tabla TBL_MS_ROLES
app.post('/POST_TBL_MS_ROLES', async (req, res) => {
    const {
        P_ROL,
        P_DESCRIPCION,
    } = req.body;

    try {
        const [rows, fields] = await pool.query(
            "CALL INS_TBL_MS_ROLES (?,?)",
            [P_ROL, P_DESCRIPCION]
        );

        // Define el objeto `newRole` con los datos del nuevo rol
        const newRole = {
            P_ROL,
            P_DESCRIPCION,
            ID_ROL: rows.insertId // O cualquier manera de obtener el ID_ROL creado
        };

        res.status(201).json(newRole);  // Envía la respuesta con los detalles del nuevo rol
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al insertar el rol.' });
    }
});

// Delete a la tabla TBL_MS_ROLES
app.post('/DEL_TBL_MS_ROLES', async (req, res) => {
    const { P_ID_ROL } = req.body;

    try {
        await pool.query("CALL DEL_TBL_MS_ROLES(?)", [P_ID_ROL]);
        res.status(200).json({ message: 'Rol eliminado con éxito.' });
    } catch (err) {
        console.log(err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') { // Código específico de error para FK
            res.status(400).json({
                error: 'No se puede eliminar el Rol porque está relacionado con otros registros.'
            });
        } else {
            res.status(500).json({
                error: 'Ocurrió un error al intentar eliminar el Rol.'
            });
        }
    }
});

// Actualizar a la tabla TBL_MS_ROLES
app.post('/PUT_TBL_MS_ROLES', async (req, res) => {
    const {
        P_ID_ROL,
        P_ROL,
        P_DESCRIPCION
    } = req.body;

    try {
        await pool.query(
            "CALL UPD_TBL_MS_ROLES(?,?,?)",
            [P_ID_ROL, P_ROL, P_DESCRIPCION]
        );
        res.send("Actualizado correctamente !!");
    } catch (err) {
        console.log(err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'El rol ingresado ya ha sido registrado.' });
        }
        res.status(500).json({ error: 'Ocurrió un error al actualizar el rol.' });
    }
});


//  ***TABLA TBL_MS_HIS_CONTRASEÑA ***

// Select <-> Get TBL_MS_HIS_CONTRASEÑA con Procedimiento almacenado
app.get('/SEL_TBL_MS_HIS_CONTRASENA', async (req, res) => {
    try {
        const [rows, fields] = await pool.query('CALL SEL_TBL_MS_HIS_CONTRASEÑA()');
        res.status(200).json(rows[0]);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al obtener el historial de contraseñas.' });
    }
});

// Insertar a la tabla TBL_MS_HIS_CONTRASEÑA
app.post('/POST_TBL_MS_HIS_CONTRASENA', async (req, res) => {
    const {
        P_ID_USUARIO,
        P_CONTRASEÑA
    } = req.body;

    try {
        await pool.query("CALL INS_TBL_MS_HIST_CONTRASEÑA (?,?)", [
            P_ID_USUARIO,
            P_CONTRASEÑA
        ]);
        res.send("Ingresado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al insertar el historial de contraseñas.' });
    }
});

// Delete a la tabla TBL_MS_HIS_CONTRASEÑA
app.post('/DEL_TBL_MS_HIS_CONTRASENA', async (req, res) => {
    const { P_ID_HIST } = req.body;

    try {
        await pool.query("CALL DEL_TBL_MS_HIST_CONTRASEÑA(?)", [P_ID_HIST]);
        res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
    } catch (err) {
        console.log(err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') { // Código específico de error para FK
            res.status(400).json({
                error: 'No se puede eliminar el historial porque está relacionado con otros registros.'
            });
        } else {
            res.status(500).json({
                error: 'Ocurrió un error al intentar eliminar el historial.'
            });
        }
    }
});

// Actualizar a la tabla TBL_MS_HIS_CONTRASEÑA
app.post('/PUT_TBL_MS_HIS_CONTRASENA', async (req, res) => {
    const {
        P_ID_HIST,
        P_ID_USUARIO,
        P_CONTRASEÑA
    } = req.body;

    try {
        await pool.query("CALL UPD_TBL_MS_HIST_CONTRASEÑA (?,?,?)", [
            P_ID_HIST,
            P_ID_USUARIO,
            P_CONTRASEÑA
        ]);
        res.send("Actualizado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al actualizar el historial de contraseñas.' });
    }
});



// Select <-> Get TBL_RESERVAS con Procedimiento almacenado
app.get('/SEL_TBL_RESERVAS', async (req, res) => {
    try {
        const [rows, fields] = await pool.query('CALL SEL_TBL_RESERVAS()');
        res.status(200).json(rows[0]);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al obtener las reservas.' });
    }
});

// Insertar a la tabla RESERVAS
app.post('/POST_TBL_RESERVAS', async (req, res) => {
    const {
        P_ID_PERSONA,
        P_ID_INSTALACION,
        P_ID_ESTADO_RESERVA,
        P_TIPO_EVENTO,
        P_HORA_FECHA
    } = req.body;

    try {
        await pool.query("CALL INS_TBL_RESERVAS (?,?,?,?,?)", [
            P_ID_PERSONA,
            P_ID_INSTALACION,
            P_ID_ESTADO_RESERVA,
            P_TIPO_EVENTO,
            P_HORA_FECHA
        ]);
        res.send("Ingresado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al insertar la reserva.' });
    }
});

// Delete a la tabla RESERVAS
app.post('/DEL_TBL_RESERVAS', async (req, res) => {
    const { P_ID_RESERVA } = req.body;

    try {
        await pool.query("CALL DEL_TBL_RESERVAS(?)", [P_ID_RESERVA]);
        res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
    } catch (err) {
        console.log(err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') { // Código específico de error para FK
            res.status(400).json({
                error: 'No se puede eliminar la reserva porque está relacionada con otros registros.'
            });
        } else {
            res.status(500).json({
                error: 'Ocurrió un error al intentar eliminar la reserva.'
            });
        }
    }
});

// Actualizar a la tabla RESERVAS
app.post('/PUT_TBL_RESERVAS', async (req, res) => {
    const {
        P_ID_RESERVA,
        P_ID_PERSONA,
        P_ID_INSTALACION,
        P_ID_ESTADO_RESERVA,
        P_TIPO_EVENTO,
        P_HORA_FECHA
    } = req.body;

    try {
        await pool.query("CALL UPD_TBL_RESERVAS (?,?,?,?,?,?)", [
            P_ID_RESERVA,
            P_ID_PERSONA,
            P_ID_INSTALACION,
            P_ID_ESTADO_RESERVA,
            P_TIPO_EVENTO,
            P_HORA_FECHA
        ]);
        res.send("Actualizado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al actualizar la reserva.' });
    }
});


//  ***TABLAS DE GABRIEL ***

//  ***TABLA INSTALACIONES ***

// Select <-> Get INSTALACIONES con Procedimiento almacenado
app.get('/SEL_INSTALACIONES', async (req, res) => {
    try {
        const [rows, fields] = await pool.query('CALL SEL_TBL_INSTALACIONES()');
        res.status(200).json(rows[0]);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al obtener las instalaciones.' });
    }
});

// Insertar a la tabla INSTALACIONES
app.post('/POST_INSTALACIONES', async (req, res) => {
    const {
        P_NOMBRE_INSTALACION,
        P_CAPACIDAD,
        P_PRECIO,
        P_DESCRIPCION
    } = req.body;

    try {
        await pool.query("CALL INS_TBL_INSTALACION (?,?,?,?)", [ 
            P_NOMBRE_INSTALACION,
            P_CAPACIDAD,
            P_PRECIO,
            P_DESCRIPCION
        ]);
        res.send("Ingresado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al insertar la instalación.' });
    }
});

// Eliminar a la tabla INSTALACIONES
app.post('/DEL_INSTALACIONES', async (req, res) => {
    const { P_ID_INSTALACION } = req.body;

    try {
        await pool.query("CALL DEL_TBL_INSTALACIONES(?)", [P_ID_INSTALACION]);
        res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
    } catch (err) {
        console.log(err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') { // Código específico de error para FK
            res.status(400).json({
                error: 'No se puede eliminar la instalación porque está relacionada con otros registros.'
            });
        } else {
            res.status(500).json({
                error: 'Ocurrió un error al intentar eliminar la instalación.'
            });
        }
    }
});

// Actualizar a la tabla INSTALACIONES
app.post('/PUT_INSTALACIONES', async (req, res) => {
    const {
        P_ID_INSTALACION,
        P_NOMBRE_INSTALACION,
        P_CAPACIDAD,
        P_PRECIO,
        P_DESCRIPCION
    } = req.body;

    try {
        await pool.query("CALL UPD_TBL_INSTALACIONES (?,?,?,?,?)", [ 
            P_ID_INSTALACION,
            P_NOMBRE_INSTALACION,
            P_CAPACIDAD,
            P_PRECIO,
            P_DESCRIPCION
        ]);
        res.send("Actualizado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al actualizar la instalación.' });
    }
});



//  ***TABLA CONDOMINIOS ***

// Select <-> Get CONDOMINIOS con Procedimiento almacenado
app.get('/SEL_CONDOMINIOS', async (req, res) => {
    try {
        const [rows, fields] = await pool.query('CALL SEL_TBL_CONDOMINIOS()');
        res.status(200).json(rows[0]);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al obtener los condominios.' });
    }
});

// Insertar a la tabla CONDOMINIOS
app.post('/POST_CONDOMINIOS', async (req, res) => {
    const {
        P_ID_TIPO_CONDOMINIO,
        P_DESCRIPCION
    } = req.body;

    try {
        await pool.query("CALL INS_TBL_CONDOMINIO (?,?)", [ 
            P_ID_TIPO_CONDOMINIO,
            P_DESCRIPCION
        ]);
        res.send("Ingresado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al insertar el condominio.' });
    }
});

// Eliminar a la tabla CONDOMINIOS
app.post('/DEL_CONDOMINIOS', async (req, res) => {
    const { P_ID_CONDOMINIO } = req.body;

    try {
        await pool.query("CALL DEL_TBL_CONDOMINIOS(?)", [P_ID_CONDOMINIO]);
        res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
    } catch (err) {
        console.log(err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') { // Código específico de error para FK
            res.status(400).json({
                error: 'No se puede eliminar el condominio porque está relacionado con otros registros.'
            });
        } else {
            res.status(500).json({
                error: 'Ocurrió un error al intentar eliminar el condominio.'
            });
        }
    }
});

// Actualizar a la tabla CONDOMINIOS
app.post('/PUT_CONDOMINIOS', async (req, res) => {
    const {
        P_ID_CONDOMINIO,
        P_ID_TIPO_CONDOMINIO,
        P_DESCRIPCION
    } = req.body;

    try {
        await pool.query("CALL UPD_TBL_CONDOMINIOS (?,?,?)", [ 
            P_ID_CONDOMINIO,
            P_ID_TIPO_CONDOMINIO,
            P_DESCRIPCION
        ]);
        res.send("Actualizado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al actualizar el condominio.' });
    }
});


//  ***TABLA PARENTESCOS ***

// Select <-> Get PARENTESCOS con Procedimiento almacenado
app.get('/SEL_PARENTESCOS', async (req, res) => {
    try {
        const [rows, fields] = await pool.query('CALL SEL_TBL_PARENTESCOS()');
        res.status(200).json(rows[0]);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al obtener los parentescos.' });
    }
});

// Insertar a la tabla PARENTESCOS
app.post('/POST_PARENTESCOS', async (req, res) => {
    const { P_DESCRIPCION } = req.body;

    try {
        await pool.query("CALL INS_TBL_PARENTESCOS (?)", [P_DESCRIPCION]);
        res.send("Ingresado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al insertar el parentesco.' });
    }
});

// Eliminar a la tabla PARENTESCOS
app.post('/DEL_TBL_PARENTESCOS', async (req, res) => {
    const { P_ID_PARENTESCO } = req.body;

    try {
        await pool.query("CALL DEL_TBL_PARENTESCOS(?)", [P_ID_PARENTESCO]);
        res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
    } catch (err) {
        console.log(err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') { // Código específico de error para FK
            res.status(400).json({
                error: 'No se puede eliminar el parentesco porque está relacionado con otros registros.'
            });
        } else {
            res.status(500).json({
                error: 'Ocurrió un error al intentar eliminar el parentesco.'
            });
        }
    }
});

// Actualizar a la tabla PARENTESCOS
app.post('/PUT_PARENTESCOS', async (req, res) => {
    const {
        P_ID_PARENTESCO,
        P_DESCRIPCION
    } = req.body;

    try {
        await pool.query("CALL UPD_TBL_PARENTESCOS (?,?)", [ 
            P_ID_PARENTESCO,
            P_DESCRIPCION
        ]);
        res.send("Actualizado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al actualizar el parentesco.' });
    }
});


//  ***TABLA VISITANTES_RECURRENTES ***

// Select <-> Get VISITANTES_RECURRENTES con Procedimiento almacenado
app.get('/SEL_VISITANTES_RECURRENTES', async (req, res) => {
    try {
        const [rows, fields] = await pool.query('CALL SEL_TBL_VISITANTES_RECURRENTES()');
        res.status(200).json(rows[0]);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al obtener los visitantes recurrentes.' });
    }
});

// Insertar a la tabla VISITANTES_RECURRENTES
app.post('/POST_VISITANTES_RECURRENTES', async (req, res) => {
    const { 
        P_ID_PERSONA,
        P_NOMBRE_VISITANTE,
        P_DNI_VISITANTE,
        P_NUM_PERSONAS,
        P_NUM_PLACA,
        P_FECHA_HORA,
        P_FECHA_VENCIMIENTO
    } = req.body;

    try {
        await pool.query("CALL INS_TBL_VISITANTES_RECURRENTES (?, ?, ?, ?, ?, ?, ?)", [ 
            P_ID_PERSONA,
            P_NOMBRE_VISITANTE,
            P_DNI_VISITANTE,
            P_NUM_PERSONAS,
            P_NUM_PLACA,
            P_FECHA_HORA,
            P_FECHA_VENCIMIENTO
        ]);
        res.send("Ingresado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al insertar el visitante recurrente.' });
    }
});

// Eliminar a la tabla VISITANTES_RECURRENTES
app.post('/DEL_VISITANTES_RECURRENTES', async (req, res) => {
    const { P_ID_VISITANTES_RECURRENTES } = req.body;

    try {
        await pool.query("CALL DEL_TBL_VISITANTES_RECURRENTES(?)", [P_ID_VISITANTES_RECURRENTES]);
        res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
    } catch (err) {
        console.log(err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') { // Código específico de error para FK
            res.status(400).json({
                error: 'No se puede eliminar el visitante porque está relacionado con otros registros.'
            });
        } else {
            res.status(500).json({
                error: 'Ocurrió un error al intentar eliminar el visitante.'
            });
        }
    }
});

// Actualizar a la tabla VISITANTES_RECURRENTES
app.post('/PUT_VISITANTES_RECURRENTES', async (req, res) => {
    const {
        P_ID_VISITANTES_RECURRENTES,
        P_ID_PERSONA,
        P_NOMBRE_VISITANTE,
        P_DNI_VISITANTE,
        P_NUM_PERSONAS,
        P_NUM_PLACA,
        P_FECHA_HORA,
        P_FECHA_VENCIMIENTO
    } = req.body;

    try {
        await pool.query("CALL UPD_TBL_VISITANTES_RECURRENTES (?, ?, ?, ?, ?, ?, ?, ?)", [ 
            P_ID_VISITANTES_RECURRENTES,
            P_ID_PERSONA,
            P_NOMBRE_VISITANTE,
            P_DNI_VISITANTE,
            P_NUM_PERSONAS,
            P_NUM_PLACA,
            P_FECHA_HORA,
            P_FECHA_VENCIMIENTO
        ]);
        res.send("Actualizado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al actualizar el visitante recurrente.' });
    }
});


//  ***TABLA ESTADO_RESERVA ***

// Select <-> Get ESTADO_RESERVA con Procedimiento almacenado
app.get('/SEL_ESTADO_RESERVA', async (req, res) => {
    try {
        const [rows, fields] = await pool.query('CALL SEL_TBL_ESTADO_RESERVA()');
        res.status(200).json(rows[0]);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al obtener los estados de reserva.' });
    }
});

// Insertar a la tabla ESTADO_RESERVA
app.post('/POST_ESTADO_RESERVA', async (req, res) => {
    const { P_DESCRIPCION } = req.body;

    try {
        await pool.query("CALL INS_TBL_ESTADO_RESERVA (?)", [P_DESCRIPCION]);
        res.send("Ingresado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al insertar el estado de reserva.' });
    }
});

// Eliminar a la tabla ESTADO_RESERVA
app.post('/DEL_ESTADO_RESERVA', async (req, res) => {
    const { P_ID_ESTADO_RESERVA } = req.body;

    try {
        await pool.query("CALL DEL_TBL_ESTADO_RESERVA(?)", [P_ID_ESTADO_RESERVA]);
        res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
    } catch (err) {
        console.log(err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            res.status(400).json({
                error: 'No se puede eliminar el estado de reserva porque está relacionado con otros registros.'
            });
        } else {
            res.status(500).json({
                error: 'Ocurrió un error al intentar eliminar el estado de reserva.'
            });
        }
    }
});

// Actualizar a la tabla ESTADO_RESERVA
app.post('/PUT_ESTADO_RESERVA', async (req, res) => {
    const {
        P_ID_ESTADO_RESERVA,
        P_DESCRIPCION
    } = req.body;

    try {
        await pool.query("CALL UPD_TBL_ESTADO_RESERVA (?,?)", [ 
            P_ID_ESTADO_RESERVA,
            P_DESCRIPCION
        ]);
        res.send("Actualizado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al actualizar el estado de reserva.' });
    }
});

//  ***TABLA TBL_MS_BITACORA ***

// Select <-> Get TBL_MS_BITACORA con Procedimiento almacenado
app.get('/SEL_TBL_MS_BITACORA', async (req, res) => {
    try {
        const [rows, fields] = await pool.query('CALL SEL_TBL_MS_BITACORA()');
        res.status(200).json(rows[0]);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al obtener los registros de bitácora.' });
    }
});

// Insertar a la tabla TBL_MS_BITACORA
app.post('/POST_TBL_MS_BITACORA', async (req, res) => {
    const {
        P_ID_USUARIO,
        P_ID_OBJETO,
        P_ACCION,
        P_DESCRIPCION
    } = req.body;

    try {
        await pool.query("CALL INS_TBL_MS_BITACORA (?,?,?,?)", [ 
            P_ID_USUARIO,
            P_ID_OBJETO,
            P_ACCION,
            P_DESCRIPCION
        ]);
        res.send("Ingresado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al insertar el registro de bitácora.' });
    }
});

// Eliminar a la tabla TBL_MS_BITACORA
app.post('/DEL_TBL_MS_BITACORA', async (req, res) => {
    const { P_ID_BITACORA } = req.body;

    try {
        await pool.query("CALL DEL_TBL_MS_BITACORA(?)", [P_ID_BITACORA]);
        res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
    } catch (err) {
        console.log(err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            res.status(400).json({
                error: 'No se puede eliminar el registro de bitácora porque está relacionado con otros registros.'
            });
        } else {
            res.status(500).json({
                error: 'Ocurrió un error al intentar eliminar el registro de bitácora.'
            });
        }
    }
});

// Actualizar a la tabla TBL_MS_BITACORA
app.post('/PUT_TBL_MS_BITACORA', async (req, res) => {
    const {
        P_ID_BITACORA,
        P_ID_USUARIO,
        P_ID_OBJETO,
        P_FECHA,
        P_ACCION,
        P_DESCRIPCION
    } = req.body;

    try {
        await pool.query("CALL UPD_TBL_MS_BITACORA (?,?,?,?,?,?)", [ 
            P_ID_BITACORA,
            P_ID_USUARIO,
            P_ID_OBJETO,
            P_FECHA,
            P_ACCION,
            P_DESCRIPCION
        ]);
        res.send("Actualizado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al actualizar el registro de bitácora.' });
    }
});



//  ***TABLAS ANDREY ***
//  ***TABLA CONTACTOS ***

// Select <-> Get CONTACTOS con Procedimiento almacenado
app.get('/SEL_CONTACTOS', async (req, res) => {
    try {
        const [rows, fields] = await pool.query('CALL SEL_TBL_CONTACTOS()');
        res.status(200).json(rows[0]);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al obtener los contactos.' });
    }
});

// Insertar a la tabla CONTACTOS
app.post('/POST_CONTACTOS', async (req, res) => {
    const {
        P_ID_TIPO_CONTACTO,
        P_DESCRIPCION
    } = req.body;

    try {
        await pool.query("CALL INS_TBL_CONTACTOS (?,?)", [ 
            P_ID_TIPO_CONTACTO,
            P_DESCRIPCION
        ]);
        res.send("Ingresado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al insertar el contacto.' });
    }
});

// Borrar a la tabla CONTACTOS
app.post('/DEL_CONTACTOS', async (req, res) => {
    const { P_ID_CONTACTO } = req.body;

    try {
        await pool.query("CALL DEL_TBL_CONTACTOS(?)", [P_ID_CONTACTO]);
        res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
    } catch (err) {
        console.log(err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            res.status(400).json({
                error: 'No se puede eliminar el contacto porque está relacionado con otros registros.'
            });
        } else {
            res.status(500).json({
                error: 'Ocurrió un error al intentar eliminar el contacto.'
            });
        }
    }
});

// Actualizar a la tabla CONTACTOS
app.post('/PUT_CONTACTOS', async (req, res) => {
    const {
        P_ID_CONTACTO,
        P_ID_TIPO_CONTACTO,
        P_DESCRIPCION
    } = req.body;

    try {
        await pool.query("CALL UPD_TBL_CONTACTOS (?,?,?)", [ 
            P_ID_CONTACTO,
            P_ID_TIPO_CONTACTO,
            P_DESCRIPCION
        ]);
        res.send("Actualizado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al actualizar el contacto.' });
    }
});




//  ***TABLA USUARIO ***

//Select <-> Get USUARIO con Procedimiento almacenado
app.get('/SEL_USUARIO', async (req, res) => {
    const start = parseInt(req.query.start) || 0;
    const length = parseInt(req.query.length) || 10;
    const search = req.query.search || '';

    try {
        const [rows, fields] = await pool.query('CALL SEL_TBL_MS_USUARIO(?, ?, ?)', [start, length, search]);
        res.status(200).json(rows[0]);
    } catch (err) {
        console.log(err);
        res.status(500).send("Error ejecutando la consulta.");
    }
});



// insertar a la tabla USUARIO
app.post('/POST_USUARIO', async (req, res) => {
    const {
        ID_ROL,
        NOMBRE_USUARIO,
        ID_ESTADO_USUARIO,
        EMAIL,
        CONTRASEÑA,
        PRIMER_INGRESO,
        FECHA_ULTIMA_CONEXION,
        FECHA_VENCIMIENTO,
        google2fa_secret,
        INTENTOS_FALLIDOS,
        INTENTOS_FALLIDOS_OTP,
        ULTIMOS_INTENTOS_FALLIDOS
    } = req.body;

    try {
        const [rows, fields] = await pool.query(
            "CALL INS_TBL_MS_USUARIO(?,?,?,?,?,?,?,?,?,?,?,?)",
            [
                ID_ROL,
                NOMBRE_USUARIO,
                ID_ESTADO_USUARIO,
                EMAIL,
                CONTRASEÑA,
                PRIMER_INGRESO,
                FECHA_ULTIMA_CONEXION,
                FECHA_VENCIMIENTO,
                google2fa_secret,
                INTENTOS_FALLIDOS,
                INTENTOS_FALLIDOS_OTP,
                ULTIMOS_INTENTOS_FALLIDOS
            ]
        );

        // Define el objeto `newUser` con los datos del usuario recién creado
        const newUser = {
            ID_ROL,
            NOMBRE_USUARIO,
            ID_ESTADO_USUARIO,
            EMAIL,
            CONTRASEÑA,
            PRIMER_INGRESO,
            FECHA_ULTIMA_CONEXION,
            FECHA_VENCIMIENTO,
            google2fa_secret,
            INTENTOS_FALLIDOS,
            INTENTOS_FALLIDOS_OTP,
            ULTIMOS_INTENTOS_FALLIDOS,
            ID_USUARIO: rows.insertId // O cualquier manera de obtener el ID_USUARIO creado
        };

        res.status(201).json(newUser);  // Envía la respuesta con los detalles del nuevo usuario
    } catch (err) {
        console.log(err);
        res.status(500).send("Error al ingresar los datos");
    }
});





// Borrar a la tabla USUARIO
app.post('/DEL_USUARIO', async (req, res) => {
    const { P_ID_USUARIO } = req.body;

    try {
        const [rows, fields] = await pool.query(
            "CALL DEL_TBL_MS_USUARIO(?)",
            [P_ID_USUARIO]
        );

        res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
    } catch (err) {
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            res.status(400).json({
                error: 'No se puede eliminar el Usuario porque está relacionado con otros registros.'
            });
        } else {
            res.status(500).json({
                error: 'Ocurrió un error al intentar eliminar el Usuario.'
            });
        }
        console.log(err);
    }
});

// ACTUALIZAR a la tabla USUARIO
app.post('/PUT_USUARIO', async (req, res) => {
    const {
        P_ID_USUARIO,
        P_ID_ROL,
        P_NOMBRE_USUARIO,
        P_ID_ESTADO_USUARIO,
        P_EMAIL,
        P_CONTRASEÑA,
        P_PRIMER_INGRESO,
        P_FECHA_ULTIMA_CONEXION,
        P_FECHA_VENCIMIENTO,
        P_google2fa_secret,
        P_INTENTOS_FALLIDOS,
        P_INTENTOS_FALLIDOS_OTP,
        P_ULTIMOS_INTENTOS_FALLIDOS
    } = req.body;

    try {
        const [rows, fields] = await pool.query(
            "CALL UPD_TBL_MS_USUARIO (?,?,?,?,?,?,?,?,?,?,?,?,?)",
            [
                P_ID_USUARIO,
                P_ID_ROL,
                P_NOMBRE_USUARIO,
                P_ID_ESTADO_USUARIO,
                P_EMAIL,
                P_CONTRASEÑA,
                P_PRIMER_INGRESO,
                P_FECHA_ULTIMA_CONEXION,
                P_FECHA_VENCIMIENTO,
                P_google2fa_secret,
                P_INTENTOS_FALLIDOS,
                P_INTENTOS_FALLIDOS_OTP,
                P_ULTIMOS_INTENTOS_FALLIDOS
            ]
        );

        res.send("Actualizado correctamente !!");
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'El correo electrónico ingresado ya ha sido registrado.' });
        }
        console.log(err);
        res.status(500).json({ message: 'Error al actualizar Usuario.' });
    }
});


//  ***TABLA TBL_PERMISOS ***
// Select <-> Get PERMISOS con Procedimiento almacenado
app.get('/SEL_PERMISOS', async (req, res) => {
    try {
        const [rows, fields] = await pool.query('CALL SEL_TBL_PERMISOS()');
        res.status(200).json(rows[0]);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al obtener los permisos.' });
    }
});

// Insertar a la tabla PERMISOS
app.post('/POST_PERMISOS', async (req, res) => {
    const {
        P_ID_ROL,
        P_ID_OBJETO,
        P_PERMISO_INSERCION,
        P_PERMISO_ELIMINACION,
        P_PERMISO_ACTUALIZACION,
        P_PERMISO_CONSULTAR,
        P_FECHA_CREACION,
        P_CREADO_POR,
        P_FECHA_MODIFICACION,
        P_MODIFICADO_POR
    } = req.body;

    try {
        await pool.query("CALL INS_TBL_PERMISOS(?,?,?,?,?,?,?,?,?,?)", [
            P_ID_ROL,
            P_ID_OBJETO,
            P_PERMISO_INSERCION,
            P_PERMISO_ELIMINACION,
            P_PERMISO_ACTUALIZACION,
            P_PERMISO_CONSULTAR,
            P_FECHA_CREACION,
            P_CREADO_POR,
            P_FECHA_MODIFICACION,
            P_MODIFICADO_POR
        ]);
        res.send("Ingresado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al insertar el permiso.' });
    }
});

// Borrar a la tabla PERMISOS
app.post('/DEL_PERMISOS', async (req, res) => {
    const { P_ID_PERMISO } = req.body;

    try {
        await pool.query("CALL DEL_TBL_PERMISOS(?)", [P_ID_PERMISO]);
        res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
    } catch (err) {
        console.log(err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            res.status(400).json({
                error: 'No se puede eliminar el permiso porque está relacionado con otros registros.'
            });
        } else {
            res.status(500).json({
                error: 'Ocurrió un error al intentar eliminar el permiso.'
            });
        }
    }
});

// Actualizar a la tabla PERMISOS
app.post('/PUT_PERMISOS', async (req, res) => {
    const {
        P_ID_PERMISO,
        P_ID_ROL,
        P_ID_OBJETO,
        P_PERMISO_INSERCION,
        P_PERMISO_ELIMINACION,
        P_PERMISO_ACTUALIZACION,
        P_PERMISO_CONSULTAR,
        P_FECHA_CREACION,
        P_CREADO_POR,
        P_FECHA_MODIFICACION,
        P_MODIFICADO_POR
    } = req.body;

    try {
        await pool.query("CALL UPD_TBL_PERMISOS (?,?,?,?,?,?,?,?,?,?,?)", [
            P_ID_PERMISO,
            P_ID_ROL,
            P_ID_OBJETO,
            P_PERMISO_INSERCION,
            P_PERMISO_ELIMINACION,
            P_PERMISO_ACTUALIZACION,
            P_PERMISO_CONSULTAR,
            P_FECHA_CREACION,
            P_CREADO_POR,
            P_FECHA_MODIFICACION,
            P_MODIFICADO_POR
        ]);
        res.send("Actualizado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al actualizar el permiso.' });
    }
});



//  ***TABLA BITACORA_VISITA ***
// Select <-> Get BITACORA_VISITA con Procedimiento almacenado
app.get('/SEL_BITACORA_VISITA', async (req, res) => {
    try {
        const [rows, fields] = await pool.query('CALL SEL_TBL_BITACORA_VISITA()');
        res.status(200).json(rows[0]);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al obtener la bitácora de visita.' });
    }
});

// Insertar a la tabla BITACORA_VISITA
app.post('/POST_BITACORA_VISITA', async (req, res) => {
    const {
        P_ID_PERSONA,
        P_ID_VISITANTE,
        P_NUM_PERSONA,
        P_NUM_PLACA,
        P_FECHA_HORA
    } = req.body;

    try {
        await pool.query("CALL INS_TBL_BITACORA_VISITA(?,?,?,?,?)", [
            P_ID_PERSONA,
            P_ID_VISITANTE,
            P_NUM_PERSONA,
            P_NUM_PLACA,
            P_FECHA_HORA
        ]);
        res.send("Ingresado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al insertar la bitácora de visita.' });
    }
});

// Borrar a la tabla BITACORA_VISITA
app.post('/DEL_BITACORA_VISITA', async (req, res) => {
    const { P_ID_BITACORA_VISITA } = req.body;

    try {
        await pool.query("CALL DEL_TBL_BITACORA_VISITA(?)", [P_ID_BITACORA_VISITA]);
        res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
    } catch (err) {
        console.log(err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            res.status(400).json({
                error: 'No se puede eliminar el registro porque está relacionado con otros registros.'
            });
        } else {
            res.status(500).json({
                error: 'Ocurrió un error al intentar eliminar el registro.'
            });
        }
    }
});

// Actualizar a la tabla BITACORA_VISITA
app.post('/PUT_BITACORA_VISITA', async (req, res) => {
    const {
        P_ID_BITACORA_VISITA,
        P_ID_PERSONA,
        P_ID_VISITANTE,
        P_NUM_PERSONA,
        P_NUM_PLACA,
        P_FECHA_HORA
    } = req.body;

    try {
        await pool.query("CALL UPD_TBL_BITACORA_VISITA (?,?,?,?,?,?)", [
            P_ID_BITACORA_VISITA,
            P_ID_PERSONA,
            P_ID_VISITANTE,
            P_NUM_PERSONA,
            P_NUM_PLACA,
            P_FECHA_HORA
        ]);
        res.send("Actualizado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al actualizar la bitácora de visita.' });
    }
});


//  ***TABLAS CHRISTOPHER ***
//  ***TABLA ESTADO_PERSONA ***

// Select <-> Get ESTADO_PERSONA con Procedimiento almacenado
app.get('/SEL_ESTADO_PERSONA', async (req, res) => {
    try {
        const [rows, fields] = await pool.query('CALL SEL_TBL_ESTADO_PERSONA()');
        res.status(200).json(rows[0]);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al obtener el estado de persona.' });
    }
});

// Insertar a la tabla ESTADO_PERSONA
app.post('/POST_ESTADO_PERSONA', async (req, res) => {
    const { P_DESCRIPCION } = req.body;

    try {
        await pool.query("CALL INS_TBL_ESTADO_PERSONA (?)", [P_DESCRIPCION]);
        res.send("Ingresado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al insertar el estado de persona.' });
    }
});

// Eliminar a la tabla ESTADO_PERSONA
app.post('/DEL_ESTADO_PERSONA', async (req, res) => {
    const { P_ID_ESTADO_PERSONA } = req.body;

    try {
        await pool.query("CALL DEL_TBL_ESTADO_PERSONA(?)", [P_ID_ESTADO_PERSONA]);
        res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
    } catch (err) {
        console.log(err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            res.status(400).json({
                error: 'No se puede eliminar el estado porque está relacionado con otros registros.'
            });
        } else {
            res.status(500).json({
                error: 'Ocurrió un error al intentar eliminar el estado de persona.'
            });
        }
    }
});

// Actualizar a la tabla ESTADO_PERSONA
app.post('/PUT_ESTADO_PERSONA', async (req, res) => {
    const { P_ID_ESTADO_PERSONA, P_DESCRIPCION } = req.body;

    try {
        await pool.query("CALL UPD_TBL_ESTADO_PERSONA (?,?)", [
            P_ID_ESTADO_PERSONA,
            P_DESCRIPCION
        ]);
        res.send("Actualizado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al actualizar el estado de persona.' });
    }
});




//  ***TABLA TBL_OBJETOS ***

// Select <-> Get TBL_OBJETOS con Procedimiento almacenado
app.get('/SEL_TBL_OBJETOS', async (req, res) => {
    try {
        const [rows, fields] = await pool.query('CALL SEL_TBL_OBJETOS()');
        res.status(200).json(rows[0]);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al obtener los objetos.' });
    }
});

// Insertar a la tabla TBL_OBJETOS
app.post('/POST_TBL_OBJETOS', async (req, res) => {
    const { P_OBJETO, P_DESCRIPCION, P_TIPO_OBJETO } = req.body;

    try {
        await pool.query("CALL INS_TBL_OBJETOS (?, ?, ?)", [P_OBJETO, P_DESCRIPCION, P_TIPO_OBJETO]);
        res.send("Ingresado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al insertar el objeto.' });
    }
});

// Eliminar a la tabla TBL_OBJETOS
app.post('/DEL_TBL_OBJETOS', async (req, res) => {
    const { P_ID_OBJETO } = req.body;

    try {
        await pool.query("CALL DEL_TBL_OBJETOS(?)", [P_ID_OBJETO]);
        res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
    } catch (err) {
        console.log(err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            res.status(400).json({
                error: 'No se puede eliminar el objeto porque está relacionado con otros registros.'
            });
        } else {
            res.status(500).json({
                error: 'Ocurrió un error al intentar eliminar el objeto.'
            });
        }
    }
});

// Actualizar a la tabla TBL_OBJETOS
app.post('/PUT_TBL_OBJETOS', async (req, res) => {
    const { P_ID_OBJETO, P_OBJETO, P_DESCRIPCION, P_TIPO_OBJETO } = req.body;

    try {
        await pool.query("CALL UPD_TBL_OBJETOS (?, ?, ?, ?)", [
            P_ID_OBJETO,
            P_OBJETO,
            P_DESCRIPCION,
            P_TIPO_OBJETO
        ]);
        res.send("Actualizado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al actualizar el objeto.' });
    }
});


//  ***TABLA REGVISITAS ***

// Select <-> Get REGVISITAS con Procedimiento almacenado
app.get('/SEL_REGVISITAS', async (req, res) => {
    try {
        const [rows, fields] = await pool.query('CALL SEL_TBL_REGVISITAS()');
        res.status(200).json(rows[0]);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al obtener los registros de visitas.' });
    }
});

// Insertar a la tabla REGVISITAS
app.post('/POST_REGVISITAS', async (req, res) => {
    const {
        P_ID_PERSONA,
        P_NOMBRE_VISITANTE,
        P_DNI_VISITANTE,
        P_NUM_PERSONAS,
        P_NUM_PLACA,
        P_FECHA_HORA
    } = req.body;

    try {
        await pool.query("CALL INS_TBL_REGVISITAS (?,?,?,?,?,?)", [ 
            P_ID_PERSONA,
            P_NOMBRE_VISITANTE,
            P_DNI_VISITANTE,
            P_NUM_PERSONAS,
            P_NUM_PLACA,
            P_FECHA_HORA
        ]);
        res.send("Ingresado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al insertar el registro de visita.' });
    }
});

// Eliminar a la tabla REGVISITAS
app.post('/DEL_REGVISITAS', async (req, res) => {
    const { P_ID_VISITANTE } = req.body;

    try {
        await pool.query("CALL DEL_TBL_REGVISITAS(?)", [P_ID_VISITANTE]);
        res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
    } catch (err) {
        console.log(err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            res.status(400).json({
                error: 'No se puede eliminar el registro de visita porque está relacionado con otros registros.'
            });
        } else {
            res.status(500).json({
                error: 'Ocurrió un error al intentar eliminar el registro de visita.'
            });
        }
    }
});

// Actualizar a la tabla REGVISITAS
app.post('/PUT_REGVISITAS', async (req, res) => {
    const {
        P_ID_VISITANTE,
        P_ID_PERSONA,
        P_NOMBRE_VISITANTE,
        P_DNI_VISITANTE,
        P_NUM_PERSONAS,
        P_NUM_PLACA,
        P_FECHA_HORA
    } = req.body;

    try {
        await pool.query("CALL UPD_TBL_REGVISITAS (?,?,?,?,?,?,?)", [ 
            P_ID_VISITANTE,
            P_ID_PERSONA,
            P_NOMBRE_VISITANTE,
            P_DNI_VISITANTE,
            P_NUM_PERSONAS,
            P_NUM_PLACA,
            P_FECHA_HORA
        ]);
        res.send("Actualizado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al actualizar el registro de visita.' });
    }
});


//  ***TABLA TBL_MS_ROLES_OBJETOS ***

// Select <-> Get TBL_MS_ROLES_OBJETOS con Procedimiento almacenado
app.get('/SEL_TBL_MS_ROLES_OBJETOS', async (req, res) => {
    try {
        const [rows, fields] = await pool.query('CALL SEL_TBL_MS_ROLES_OBJETOS()');
        res.status(200).json(rows[0]);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al obtener los registros de roles y objetos.' });
    }
});

// Insertar a la tabla TBL_MS_ROLES_OBJETOS
app.post('/POST_TBL_MS_ROLES_OBJETOS', async (req, res) => {
    const {
        P_ID_OBJETOS,
        P_PERMISO_INSERCION,
        P_PERMISO_ELIMINACION,
        P_PERMISO_ACTUALIZACION,
        P_FECHA_CREACION,
        P_CREADO_POR,
        P_FECHA_MODIFICACION,
        P_MODIFICADO_POR,
        P_PERMISO_CONSULTAR
    } = req.body;

    try {
        await pool.query("CALL INS_TBL_MS_ROLES_OBJETOS (?,?,?,?,?,?,?,?,?)", [ 
            P_ID_OBJETOS,
            P_PERMISO_INSERCION,
            P_PERMISO_ELIMINACION,
            P_PERMISO_ACTUALIZACION,
            P_FECHA_CREACION,
            P_CREADO_POR,
            P_FECHA_MODIFICACION,
            P_MODIFICADO_POR,
            P_PERMISO_CONSULTAR
        ]);
        res.send("Ingresado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al insertar el registro de roles y objetos.' });
    }
});

// Eliminar la tabla TBL_MS_ROLES_OBJETOS
app.post('/DEL_TBL_MS_ROLES_OBJETOS', async (req, res) => {
    const { P_ID_ROL } = req.body;

    try {
        await pool.query("CALL DEL_TBL_MS_ROLES_OBJETOS(?)", [P_ID_ROL]);
        res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
    } catch (err) {
        console.log(err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            res.status(400).json({
                error: 'No se puede eliminar el registro de rol y objeto porque está relacionado con otros registros.'
            });
        } else {
            res.status(500).json({
                error: 'Ocurrió un error al intentar eliminar el registro de rol y objeto.'
            });
        }
    }
});

// Actualizar a la tabla TBL_MS_ROLES_OBJETOS
app.post('/PUT_TBL_MS_ROLES_OBJETOS', async (req, res) => {
    const {
        P_ID_ROL,
        P_ID_OBJETOS,
        P_PERMISO_INSERCION,
        P_PERMISO_ELIMINACION,
        P_PERMISO_ACTUALIZACION,
        P_FECHA_CREACION,
        P_CREADO_POR,
        P_FECHA_MODIFICACION,
        P_MODIFICADO_POR,
        P_PERMISO_CONSULTAR
    } = req.body;

    try {
        await pool.query("CALL UPD_TBL_MS_ROLES_OBJETOS (?,?,?,?,?,?,?,?,?,?)", [ 
            P_ID_ROL,
            P_ID_OBJETOS,
            P_PERMISO_INSERCION,
            P_PERMISO_ELIMINACION,
            P_PERMISO_ACTUALIZACION,
            P_FECHA_CREACION,
            P_CREADO_POR,
            P_FECHA_MODIFICACION,
            P_MODIFICADO_POR,
            P_PERMISO_CONSULTAR
        ]);
        res.send("Actualizado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al actualizar el registro de roles y objetos.' });
    }
});

//  ***TABLAS WILSON MOYA ***

//  ***TABLA TIPO_CONTACTO ***

// Select <-> Get TIPO_CONTACTO con Procedimiento almacenado
app.get('/SEL_TIPO_CONTACTO', async (req, res) => {
    try {
        const [rows, fields] = await pool.query('CALL SEL_TBL_TIPO_CONTACTO()');
        res.status(200).json(rows[0]);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al obtener los registros de tipo de contacto.' });
    }
});

// Insertar a la tabla TIPO_CONTACTO
app.post('/POST_TIPO_CONTACTO', async (req, res) => {
    const { P_DESCRIPCION } = req.body;

    try {
        await pool.query("CALL INS_TBL_TIPO_CONTACTO (?)", [P_DESCRIPCION]);
        res.send("Ingresado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al insertar el tipo de contacto.' });
    }
});

// Borrar a la tabla TIPO_CONTACTO
app.post('/DEL_TIPO_CONTACTO', async (req, res) => {
    const { P_ID_TIPO_CONTACTO } = req.body;

    try {
        await pool.query("CALL DEL_TBL_TIPO_CONTACTO(?)", [P_ID_TIPO_CONTACTO]);
        res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
    } catch (err) {
        console.log(err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            res.status(400).json({
                error: 'No se puede eliminar el Tipo de Contacto porque está relacionado con otros registros.'
            });
        } else {
            res.status(500).json({
                error: 'Ocurrió un error al intentar eliminar el Tipo de Contacto.'
            });
        }
    }
});

// Actualizar a la tabla TIPO_CONTACTO
app.post('/PUT_TIPO_CONTACTO', async (req, res) => {
    const { P_ID_TIPO_CONTACTO, P_DESCRIPCION } = req.body;

    try {
        await pool.query("CALL UPD_TBL_TIPO_CONTACTO (?,?)", [P_ID_TIPO_CONTACTO, P_DESCRIPCION]);
        res.send("Actualizado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al actualizar el tipo de contacto.' });
    }
});






//  ***TABLA TIPO_CONDOMINIO***

// Select <-> Get TIPO_CONDOMINIO con Procedimiento almacenado
app.get('/SEL_TIPO_CONDOMINIO', async (req, res) => {
    try {
        const [rows, fields] = await pool.query('CALL SEL_TBL_TIPO_CONDOMINIO()');
        res.status(200).json(rows[0]);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al obtener los registros de tipo de condominio.' });
    }
});

// Insertar a la tabla TIPO_CONDOMINIO
app.post('/POST_TIPO_CONDOMINIO', async (req, res) => {
    const { P_DESCRIPCION } = req.body;

    try {
        await pool.query("CALL INS_TBL_TIPO_CONDOMINIO (?)", [P_DESCRIPCION]);
        res.send("Ingresado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al insertar el tipo de condominio.' });
    }
});

// Borrar a la tabla TIPO_CONDOMINIO
app.post('/DEL_TIPO_CONDOMINIO', async (req, res) => {
    const { P_ID_TIPO_CONDOMINIO } = req.body;

    try {
        await pool.query("CALL DEL_TBL_TIPO_CONDOMINIO(?)", [P_ID_TIPO_CONDOMINIO]);
        res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
    } catch (err) {
        console.log(err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            res.status(400).json({
                error: 'No se puede eliminar el Tipo de Condominio porque está relacionado con otros registros.'
            });
        } else {
            res.status(500).json({
                error: 'Ocurrió un error al intentar eliminar el Tipo de Condominio.'
            });
        }
    }
});

// Actualizar a la tabla TIPO_CONDOMINIO
app.post('/PUT_TIPO_CONDOMINIO', async (req, res) => {
    const { P_ID_TIPO_CONDOMINIO, P_DESCRIPCION } = req.body;

    try {
        await pool.query("CALL UPD_TBL_TIPO_CONDOMINIO (?,?)", [P_ID_TIPO_CONDOMINIO, P_DESCRIPCION]);
        res.send("Actualizado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al actualizar el tipo de condominio.' });
    }
});



//  ***TABLA ESTADO_USUARIO***

// Select <-> Get ESTADO_USUARIO con Procedimiento almacenado
app.get('/SEL_ESTADO_USUARIO', async (req, res) => {
    try {
        const [rows, fields] = await pool.query('CALL SEL_TBL_ESTADO_USUARIO()');
        res.status(200).json(rows[0]);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al obtener los registros de estado de usuario.' });
    }
});

// Insertar a la tabla ESTADO_USUARIO
app.post('/POST_ESTADO_USUARIO', async (req, res) => {
    const { P_DESCRIPCION } = req.body;

    try {
        await pool.query("CALL INS_TBL_ESTADO_USUARIO (?)", [P_DESCRIPCION]);
        res.send("Ingresado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al insertar el estado de usuario.' });
    }
});

// Borrar a la tabla ESTADO_USUARIO
app.post('/DEL_ESTADO_USUARIO', async (req, res) => {
    const { P_ID_ESTADO_USUARIO } = req.body;

    try {
        await pool.query("CALL DEL_TBL_ESTADO_USUARIO(?)", [P_ID_ESTADO_USUARIO]);
        res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
    } catch (err) {
        console.log(err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            res.status(400).json({
                error: 'No se puede eliminar el Estado porque está relacionado con otros registros.'
            });
        } else {
            res.status(500).json({
                error: 'Ocurrió un error al intentar eliminar el estado de usuario.'
            });
        }
    }
});

// Actualizar a la tabla ESTADO_USUARIO
app.post('/PUT_ESTADO_USUARIO', async (req, res) => {
    const { P_ID_ESTADO_USUARIO, P_DESCRIPCION } = req.body;

    try {
        await pool.query("CALL UPD_TBL_ESTADO_USUARIO(?,?)", [P_ID_ESTADO_USUARIO, P_DESCRIPCION]);
        res.send("Actualizado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al actualizar el estado de usuario.' });
    }
});







//  ***TABLA TBL_MS_PARAMETROS***

// Select <-> Get TBL_MS_PARAMETROS con Procedimiento almacenado
app.get('/SEL_TBL_MS_PARAMETROS', async (req, res) => {
    try {
        const [rows, fields] = await pool.query('CALL SEL_TBL_MS_PARAMETROS()');
        res.status(200).json(rows[0]);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al obtener los parámetros.' });
    }
});

// Insertar a la tabla TBL_MS_PARAMETROS
app.post('/POST_TBL_MS_PARAMETROS', async (req, res) => {
    const {
        P_ID_USUARIO,
        P_PARAMETRO,
        P_VALOR,
        P_FECHA_CREACION,
        P_FECHA_MODIFICACION
    } = req.body;

    try {
        await pool.query("CALL INS_TBL_MS_PARAMETROS (?,?,?,?,?)", [
            P_ID_USUARIO,
            P_PARAMETRO,
            P_VALOR,
            P_FECHA_CREACION,
            P_FECHA_MODIFICACION
        ]);
        res.send("Ingresado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al insertar el parámetro.' });
    }
});

// Borrar a la tabla TBL_MS_PARAMETROS
app.post('/DEL_TBL_MS_PARAMETROS', async (req, res) => {
    const { P_ID_PARAMETRO } = req.body;

    try {
        await pool.query("CALL DEL_TBL_MS_PARAMETROS(?)", [P_ID_PARAMETRO]);
        res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
    } catch (err) {
        console.log(err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            res.status(400).json({
                error: 'No se puede eliminar el Parámetro porque está relacionado con otros registros.'
            });
        } else {
            res.status(500).json({
                error: 'Ocurrió un error al intentar eliminar el parámetro.'
            });
        }
    }
});

// Actualizar a la tabla TBL_MS_PARAMETROS
app.post('/PUT_TBL_MS_PARAMETROS', async (req, res) => {
    console.log(req.body.P_VALOR);  // Verificar que la ruta de la imagen se reciba correctamente

    const {
        P_ID_PARAMETRO,
        P_ID_USUARIO,
        P_PARAMETRO,
        P_VALOR,
        P_FECHA_CREACION,
        P_FECHA_MODIFICACION
    } = req.body;

    try {
        await pool.query("CALL UPD_TBL_MS_PARAMETROS(?,?,?,?,?,?)", [
            P_ID_PARAMETRO,
            P_ID_USUARIO,
            P_PARAMETRO,
            P_VALOR,
            P_FECHA_CREACION,
            P_FECHA_MODIFICACION
        ]);
        res.send("Actualizado correctamente !!");
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Ocurrió un error al actualizar el parámetro.' });
    }
});







