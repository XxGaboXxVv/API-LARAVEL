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

//Select <-> Get TBL_MS_ROLES con Procedimiento almacenado
app.get('/SEL_TBL_MS_ROLES', (req, res) => {
    pool.query('call SEL_TBL_MS_ROLES()', (err, rows, fields) => {
        if (!err) {
            res.status(200).json(rows[0]);
        } else {
            console.log(err);
        }
    });
});

// insertar a la tabla TBL_MS_ROLES
app.post('/POST_TBL_MS_ROLES', (req, res) => {
    const {
        P_ROL,
        P_DESCRIPCION,
    } = req.body;

    pool.query("CALL INS_TBL_MS_ROLES (?,?)", [ P_ROL,
        P_DESCRIPCION
    ], (err, rows, fields) => {

        if (!err) {
            res.send("Ingresado correctamente !!");
        } else {
            console.log(err);
        }
    });
});

// Delete a la tabla TBL_MS_ROLES
app.post('/DEL_TBL_MS_ROLES', (req, res) => {
    const { P_ID_ROL } = req.body;

    pool.query(
        "CALL DEL_TBL_MS_ROLES(?)",
        [P_ID_ROL],
        (err, rows, fields) => {
            if (!err) {
                // Return the updated data
                res.status(200).json(req.body);
            } else {
                if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                    res.status(400).json({
                        error: 'No se puede eliminar el Rol porque está relacionado con otros registros.'
                    });
                } else {
                    res.status(500).json({
                        error: 'Ocurrió un error al intentar eliminar el Rol.'
                    });
                }
                console.log(err);
            }
        }
    );
});

// ACTUALIZAR a la tabla TBL_MS_ROLES
app.post('/PUT_TBL_MS_ROLES', (req, res) => {
    const {
        P_ID_ROL,
        P_ROL,
        P_DESCRIPCION
    } = req.body;

    pool.query("CALL UPD_TBL_MS_ROLES (?,?,?)", [ P_ID_ROL,
        P_ROL,
        P_DESCRIPCION,
    ], (err, rows, fields) => {

        if (!err) {
            res.send("Actualizado correctamente !!");
        } else {
            console.log(err);
        }
    });
});

//  ***TABLA TBL_MS_HIS_CONTRASEÑA ***

//Select <-> Get TBL_MS_HIS_CONTRASEÑA con Procedimiento almacenado
app.get('/SEL_TBL_MS_HIS_CONTRASENA', (req, res) => {
    pool.query('call SEL_TBL_MS_HIS_CONTRASEÑA()', (err, rows, fields) => {
        if (!err) {
            res.status(200).json(rows[0]);
        } else {
            console.log(err);
        }
    });
});

// insertar a la tabla TBL_MS_HIS_CONTRASEÑA
app.post('/POST_TBL_MS_HIS_CONTRASENA', (req, res) => {
    const {
        P_ID_USUARIO,
        P_CONTRASEÑA
    } = req.body;

    pool.query("CALL INS_TBL_MS_HIST_CONTRASEÑA (?,?)", [ P_ID_USUARIO,
        P_CONTRASEÑA
    ], (err, rows, fields) => {

        if (!err) {
            res.send("Ingresado correctamente !!");
        } else {
            console.log(err);
        }
    });
});

// Delete a la tabla TBL_MS_HIS_CONTRASEÑA
app.post('/DEL_TBL_MS_HIS_CONTRASENA', (req, res) => {
    const { P_ID_HIST } = req.body;

    pool.query(
        "CALL DEL_TBL_MS_HIST_CONTRASEÑA(?)",
        [P_ID_HIST],
        (err, rows, fields) => {
            if (!err) {
                res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
            } else {
                if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                    res.status(400).json({
                        error: 'No se puede eliminar el Historial porque está relacionado con otros registros.'
                    });
                } else {
                    res.status(500).json({
                        error: 'Ocurrió un error al intentar eliminar el Historial.'
                    });
                }
                console.log(err);
            }
        }
    );
});

// ACTUALIZAR a la tabla TBL_MS_HIS_CONTRASEÑA
app.post('/PUT_TBL_MS_HIS_CONTRASENA', (req, res) => {
    const {
        P_ID_HIST,
        P_ID_USUARIO,
        P_CONTRASEÑA
    } = req.body;

    pool.query("CALL UPD_TBL_MS_HIST_CONTRASEÑA (?,?,?)", [ P_ID_HIST,
        P_ID_USUARIO,
        P_CONTRASEÑA
    ], (err, rows, fields) => {

        if (!err) {
            res.send("Actualizado correctamente !!");
        } else {
            console.log(err);
        }
    });
});


//  ***TABLA RESERVAS ***

//Select <-> Get RESERVAS con Procedimiento almacenado
app.get('/SEL_TBL_RESERVAS', (req, res) => {
    pool.query('call SEL_TBL_RESERVAS()', (err, rows, fields) => {
        if (!err) {
            res.status(200).json(rows[0]);
        } else {
            console.log(err);
        }
    });
});

// insertar a la tabla RESERVAS
app.post('/POST_TBL_RESERVAS', (req, res) => {
    const {
        P_ID_PERSONA,
        P_ID_INSTALACION,
        P_ID_ESTADO_RESERVA,
        P_TIPO_EVENTO,
        P_HORA_FECHA
    } = req.body;

    pool.query("CALL INS_TBL_RESERVAS (?,?,?,?,?)", [ P_ID_PERSONA,
        P_ID_INSTALACION,
        P_ID_ESTADO_RESERVA,
        P_TIPO_EVENTO,
        P_HORA_FECHA
    ], (err, rows, fields) => {

        if (!err) {
            res.send("Ingresado correctamente !!");
        } else {
            console.log(err);
        }
    });
});

// Delete a la tabla RESERVAS
app.post('/DEL_TBL_RESERVAS', (req, res) => {
    const { P_ID_RESERVA } = req.body;

    pool.query(
        "CALL DEL_TBL_RESERVAS(?)",
        [P_ID_RESERVA],
        (err, rows, fields) => {
            if (!err) {
                res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
            } else {
                if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                    res.status(400).json({
                        error: 'No se puede eliminar el Estado porque está relacionado con otros registros.'
                    });
                } else {
                    res.status(500).json({
                        error: 'Ocurrió un error al intentar eliminar el Estado.'
                    });
                }
                console.log(err);
            }
        }
    );
});

// ACTUALIZAR a la tabla RESERVAS
app.post('/PUT_TBL_RESERVAS', (req, res) => {
    const {
        P_ID_RESERVA,
        P_ID_PERSONA,
        P_ID_INSTALACION,
        P_ID_ESTADO_RESERVA,
        P_TIPO_EVENTO,
        P_HORA_FECHA
    } = req.body;

    pool.query("CALL UPD_TBL_RESERVAS (?,?,?,?,?,?)", [ P_ID_RESERVA,
        P_ID_PERSONA,
        P_ID_INSTALACION,
        P_ID_ESTADO_RESERVA,
        P_TIPO_EVENTO,
        P_HORA_FECHA
    ], (err, rows, fields) => {

        if (!err) {
            res.send("Actualizado correctamente !!");
        } else {
            console.log(err);
        }
    });
});

//  ***TABLAS DE GABRIEL ***

//  ***TABLA INSTALACIONES ***

//Select <-> Get INSTALACIONES con Procedimiento almacenado
app.get('/SEL_INSTALACIONES', (req, res) => {
    pool.query('call SEL_TBL_INSTALACIONES()', (err, rows, fields) => {
        if (!err) {
            res.status(200).json(rows[0]);
        } else {
            console.log(err);
        }
    });
});

// insertar a la tabla INSTALACIONES
app.post('/POST_INSTALACIONES', (req, res) => {
    const {
        P_NOMBRE_INSTALACION,
        P_CAPACIDAD,
        P_PRECIO,
        P_DESCRIPCION
    } = req.body;

    pool.query("CALL INS_TBL_INSTALACION (?,?,?,?)", [ 
        P_NOMBRE_INSTALACION,
        P_CAPACIDAD,
        P_PRECIO,
        P_DESCRIPCION], (err, rows, fields) => {

        if (!err) {
            res.send("Ingresado correctamente !!");
        } else {
            console.log(err);
        }
    });
});

// Eliminar a la tabla INSTALACIONES
app.post('/DEL_INSTALACIONES', (req, res) => {
    const { P_ID_INSTALACION } = req.body;

    pool.query(
        "CALL DEL_TBL_INSTALACIONES(?)",
        [P_ID_INSTALACION],
        (err, rows, fields) => {
            if (!err) {
                res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
            } else {
                if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                    res.status(400).json({
                        error: 'No se puede eliminar la Instalacion porque está relacionado con otros registros.'
                    });
                } else {
                    res.status(500).json({
                        error: 'Ocurrió un error al intentar eliminar la Instalacion.'
                    });
                }
                console.log(err);
            }
        }
    );
});

// ACTUALIZAR a la tabla INSTALACIONES
app.post('/PUT_INSTALACIONES', (req, res) => {
    const {
        P_ID_INSTALACION,
        P_NOMBRE_INSTALACION,
        P_CAPACIDAD,
        P_PRECIO,
        P_DESCRIPCION
    } = req.body;

    pool.query("CALL UPD_TBL_INSTALACIONES (?,?,?,?,?)", [ 
        P_ID_INSTALACION,
        P_NOMBRE_INSTALACION,
        P_CAPACIDAD,
        P_PRECIO,
        P_DESCRIPCION], (err, rows, fields) => {

        if (!err) {
            res.send("Ingresado correctamente !!");
        } else {
            console.log(err);
        }
    });
});


//  ***TABLA CONDOMINIOS ***

//Select <-> Get CONDOMINIOS con Procedimiento almacenado
app.get('/SEL_CONDOMINIOS', (req, res) => {
    pool.query('call SEL_TBL_CONDOMINIOS()', (err, rows, fields) => {
        if (!err) {
            res.status(200).json(rows[0]);
        } else {
            console.log(err);
        }
    });
});

// insertar a la tabla CONDOMINIOS
app.post('/POST_CONDOMINIOS', (req, res) => {
    const {
        P_ID_TIPO_CONDOMINIO,
       P_DESCRIPCION
    } = req.body;

    pool.query("CALL INS_TBL_CONDOMINIO (?,?)", [ 
        P_ID_TIPO_CONDOMINIO,
        P_DESCRIPCION
    ], (err, rows, fields) => {

        if (!err) {
            res.send("Ingresado correctamente !!");
        } else {
            console.log(err);
        }
    });
});

// Eliminar a la tabla CONDOMINIOS
app.post('/DEL_CONDOMINIOS', (req, res) => {
    const { P_ID_CONDOMINIO } = req.body;

    pool.query(
        "CALL DEL_TBL_CONDOMINIOS(?)",
        [P_ID_CONDOMINIO],
        (err, rows, fields) => {
            if (!err) {
                res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
            } else {
                if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                    res.status(400).json({
                        error: 'No se puede eliminar el Condominio porque está relacionado con otros registros.'
                    });
                } else {
                    res.status(500).json({
                        error: 'Ocurrió un error al intentar Eliminar el Condominio.'
                    });
                }
                console.log(err);
            }
        }
    );
});

// ACTUALIZAR a la tabla CONDOMINIOS
app.post('/PUT_CONDOMINIOS', (req, res) => {
    const {
        P_ID_CONDOMINIO,
        P_ID_TIPO_CONDOMINIO,
        P_DESCRIPCION

    } = req.body;

    pool.query("CALL UPD_TBL_CONDOMINIOS (?,?,?)", [ 
        P_ID_CONDOMINIO,
        P_ID_TIPO_CONDOMINIO,
        P_DESCRIPCION
    ], (err, rows, fields) => {

        if (!err) {
            res.send("Ingresado correctamente !!");
        } else {
            console.log(err);
        }
    });
});

//  ***TABLA PARENTESCOS ***

//Select <-> Get PARENTESCOS con Procedimiento almacenado
app.get('/SEL_PARENTESCOS', (req, res) => {
    pool.query('call SEL_TBL_PARENTESCOS()', (err, rows, fields) => {
        if (!err) {
            res.status(200).json(rows[0]);
        } else {
            console.log(err);
        }
    });
});

// insertar a la tabla PARENTESCOS
app.post('/POST_PARENTESCOS', (req, res) => {
    const {
        P_DESCRIPCION
    } = req.body;

    pool.query("CALL INS_TBL_PARENTESCOS (?)", [ 
        P_DESCRIPCION],
         (err, rows, fields) => {

        if (!err) {
            res.send("Ingresado correctamente !!");
        } else {
            console.log(err);
        }
    });
});

// Eliminar a la tabla PARENTESCOS
app.post('/DEL_TBL_PARENTESCOS', (req, res) => {
    const { P_ID_PARENTESCO } = req.body;

    pool.query(
        "CALL DEL_TBL_PARENTESCOS(?)",
        [P_ID_PARENTESCO],
        (err, rows, fields) => {
            if (!err) {
                res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
            } else {
                if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                    res.status(400).json({
                        error: 'No se puede eliminar el Parentesco porque está relacionado con otros registros.'
                    });
                } else {
                    res.status(500).json({
                        error: 'Ocurrió un error al intentar eliminar el Parentesco.'
                    });
                }
                console.log(err);
            }
        }
    );
});

// ACTUALIZAR a la tabla PARENTESCOS
app.post('/PUT_PARENTESCOS', (req, res) => {
    const {
        P_ID_PARENTESCO,
        P_DESCRIPCION
    } = req.body;

    pool.query("CALL UPD_TBL_PARENTESCOS (?,?)", [ 
        P_ID_PARENTESCO,
        P_DESCRIPCION
    ], (err, rows, fields) => {

        if (!err) {
            res.send("Ingresado correctamente !!");
        } else {
            console.log(err);
        }
    });
});

//  ***TABLA VISITANTES_RECURRENTES ***

//Select <-> Get VISITANTES_RECURRENTES con Procedimiento almacenado
app.get('/SEL_VISITANTES_RECURRENTES', (req, res) => {
    pool.query('call SEL_TBL_VISITANTES_RECURRENTES()', (err, rows, fields) => {
        if (!err) {
            res.status(200).json(rows[0]);
        } else {
            console.log(err);
        }
    });
});

// insertar a la tabla VISITANTES_RECURRENTES
app.post('/POST_VISITANTES_RECURRENTES', (req, res) => {
    const { 
        P_ID_PERSONA,
        P_NOMBRE_VISITANTE,
        P_DNI_VISITANTE,
        P_NUM_PERSONAS,
        P_NUM_PLACA,
		P_FECHA_HORA,
        P_FECHA_VENCIMIENTO
      
    } = req.body;

    pool.query("CALL INS_TBL_VISITANTES_RECURRENTES (?,?,?,?,?,?,?)", [ 
        P_ID_PERSONA,
        P_NOMBRE_VISITANTE,
        P_DNI_VISITANTE,
        P_NUM_PERSONAS,
        P_NUM_PLACA,
		P_FECHA_HORA,
        P_FECHA_VENCIMIENTO

       ], (err, rows, fields) => {

        if (!err) {
            res.send("Ingresado correctamente !!");
        } else {
            console.log(err);
        }
    });
});

// Eliminar a la tabla VISITANTES_RECURRENTES
app.post('/DEL_VISITANTES_RECURRENTES', (req, res) => {
    const { P_ID_VISITANTES_RECURRENTES } = req.body;

    pool.query(
        "CALL DEL_TBL_VISITANTES_RECURRENTES(?)",
        [P_ID_VISITANTES_RECURRENTES],
        (err, rows, fields) => {
            if (!err) {
                res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
            } else {
                if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                    res.status(400).json({
                        error: 'No se puede eliminar el Vistante porque está relacionado con otros registros.'
                    });
                } else {
                    res.status(500).json({
                        error: 'Ocurrió un error al intentar eliminar el Vistante.'
                    });
                }
                console.log(err);
            }
        }
    );
});

// ACTUALIZAR a la tabla VISITANTES_RECURRENTES
app.post('/PUT_VISITANTES_RECURRENTES', (req, res) => {
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

    pool.query("CALL UPD_TBL_VISITANTES_RECURRENTES (?,?,?,?,?,?,?,?)", [ 
        P_ID_VISITANTES_RECURRENTES,
        P_ID_PERSONA,
        P_NOMBRE_VISITANTE,
        P_DNI_VISITANTE,
        P_NUM_PERSONAS,
        P_NUM_PLACA,
        P_FECHA_HORA,
        P_FECHA_VENCIMIENTO
    
    
    
    ], (err, rows, fields) => {

        if (!err) {
            res.send("Ingresado correctamente !!");
        } else {
            console.log(err);
        }
    });
});

//  ***TABLA ESTADO_RESERVA ***

//Select <-> Get ESTADO_RESERVA con Procedimiento almacenado
app.get('/SEL_ESTADO_RESERVA', (req, res) => {
    pool.query('call SEL_TBL_ESTADO_RESERVA()', (err, rows, fields) => {
        if (!err) {
            res.status(200).json(rows[0]);
        } else {
            console.log(err);
        }
    });
});

// insertar a la tabla ESTADO_RESERVA
app.post('/POST_ESTADO_RESERVA', (req, res) => {
    const {
        P_DESCRIPCION
    } = req.body;

    pool.query("CALL INS_TBL_ESTADO_RESERVA (?)", [ 
        P_DESCRIPCION],
         (err, rows, fields) => {

        if (!err) {
            res.send("Ingresado correctamente !!");
        } else {
            console.log(err);
        }
    });
});

// Eliminar a la tabla ESTADO_RESERVA
app.post('/DEL_ESTADO_RESERVA', (req, res) => {
    const { P_ID_ESTADO_RESERVA } = req.body;

    pool.query(
        "CALL DEL_TBL_ESTADO_RESERVA(?)",
        [P_ID_ESTADO_RESERVA],
        (err, rows, fields) => {
            if (!err) {
                res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
            } else {
                if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                    res.status(400).json({
                        error: 'No se puede eliminar el Estado porque está relacionado con otros registros.'
                    });
                } else {
                    res.status(500).json({
                        error: 'Ocurrió un error al intentar Estado el Usuario.'
                    });
                }
                console.log(err);
            }
        }
    );
});

// ACTUALIZAR a la tabla ESTADO_RESERVA
app.post('/PUT_ESTADO_RESERVA', (req, res) => {
    const {
        P_ID_ESTADO_RESERVA,
        P_DESCRIPCION
    } = req.body;

    pool.query("CALL UPD_TBL_ESTADO_RESERVA (?,?)", [ 
        P_ID_ESTADO_RESERVA,
        P_DESCRIPCION
    ], (err, rows, fields) => {

        if (!err) {
            res.send("Ingresado correctamente !!");
        } else {
            console.log(err);
        }
    });
});
//  ***TABLA TBL_MS_BITACORA ***

//Select <-> Get TBL_MS_BITACORA con Procedimiento almacenado
app.get('/SEL_TBL_MS_BITACORA', (req, res) => {
    pool.query('call SEL_TBL_MS_BITACORA()', (err, rows, fields) => {
        if (!err) {
            res.status(200).json(rows[0]);
        } else {
            console.log(err);
        }
    });
});

// insertar a la tabla TBL_MS_BITACORA
app.post('/POST_TBL_MS_BITACORA', (req, res) => {
    const {
    P_ID_USUARIO,
    P_ID_OBJETO,
    P_ACCION,
    P_DESCRIPCION
    } = req.body;

    pool.query("CALL INS_TBL_MS_BITACORA (?,?,?,?)", [ 
        P_ID_USUARIO,
        P_ID_OBJETO,
        P_ACCION,
        P_DESCRIPCION
    ], (err, rows, fields) => {

        if (!err) {
            res.send("Ingresado correctamente !!");
        } else {
            console.log(err);
        }
    });
});

// Eliminar a la tabla TBL_MS_BITACORA
app.post('/DEL_TBL_MS_BITACORA', (req, res) => {
    const { P_ID_BITACORA } = req.body;

    pool.query(
        "CALL DEL_TBL_MS_BITACORA(?)",
        [P_ID_BITACORA],
        (err, rows, fields) => {
            if (!err) {
                res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
            } else {
                if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                    res.status(400).json({
                        error: 'No se puede eliminar el Registro porque está relacionado con otros registros.'
                    });
                } else {
                    res.status(500).json({
                        error: 'Ocurrió un error al intentar eliminar el Registro.'
                    });
                }
                console.log(err);
            }
        }
    );
});

// ACTUALIZAR a la tabla TBL_MS_BITACORA
app.post('/PUT_TBL_MS_BITACORA', (req, res) => {
    const {
        P_ID_BITACORA,
        P_ID_USUARIO,
        P_ID_OBJETO,
        P_FECHA,
        P_ACCION,
        P_DESCRIPCION
    } = req.body;

    pool.query("CALL UPD_TBL_MS_BITACORA (?,?,?,?,?,?)", [ 
        P_ID_BITACORA,
        P_ID_USUARIO,
        P_ID_OBJETO,
        P_FECHA,
        P_ACCION,
        P_DESCRIPCION], (err, rows, fields) => {

        if (!err) {
            res.send("Ingresado correctamente !!");
        } else {
            console.log(err);
        }
    });
});


//  ***TABLAS ANDREY ***
//  ***TABLA CONTACTOS ***

//Select <-> Get CONTACTOS con Procedimiento almacenado
app.get('/SEL_CONTACTOS', (req, res) => {
    pool.query('call SEL_TBL_CONTACTOS()', (err, rows, fields) => {
        if (!err) {
            res.status(200).json(rows[0]);
        } else {
            console.log(err);
        }
    });
});

// insertar a la tabla CONTACTOS
app.post('/POST_CONTACTOS', (req, res) => {
    const {
        P_ID_TIPO_CONTACTO,
        P_DESCRIPCION
    } = req.body;

    pool.query("CALL INS_TBL_CONTACTOS (?,?)", [P_ID_TIPO_CONTACTO,
        P_DESCRIPCION], (err, rows, fields) => {

        if (!err) {
            res.send("Ingresado correctamente !!");
        } else {
            console.log(err);
        }
    });
});


// Borrar a la tabla CONTACTOS
app.post('/DEL_CONTACTOS', (req, res) => {
    const {P_ID_CONTACTO} = req.body;

    pool.query(
        "CALL DEL_TBL_CONTACTOS(?)",
        [P_ID_CONTACTO],
        (err, rows, fields) => {
            if (!err) {
                res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
            } else {
                if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                    res.status(400).json({
                        error: 'No se puede eliminar el Contacto porque está relacionado con otros registros.'
                    });
                } else {
                    res.status(500).json({
                        error: 'Ocurrió un error al intentar eliminar el Contacto.'
                    });
                }
                console.log(err);
            }
        }
    );
});

// ACTUALIZAR a la tabla CONTACTOS
app.post('/PUT_CONTACTOS', (req, res) => {
    const {
        P_ID_CONTACTO,
		P_ID_TIPO_CONTACTO,
        P_DESCRIPCION
    } = req.body;

    pool.query("CALL UPD_TBL_CONTACTOS (?,?,?)", [P_ID_CONTACTO,
		P_ID_TIPO_CONTACTO,
        P_DESCRIPCION], (err, rows, fields) => {

        if (!err) {
            res.send("Actualizado correctamente !!");
        } else {
            console.log(err);
        }
    });
});




//  ***TABLA USUARIO ***

//Select <-> Get USUARIO con Procedimiento almacenado
app.get('/SEL_USUARIO', async (req, res) => {
    try {
        const [rows, fields] = await pool.query('CALL SEL_TBL_MS_USUARIO()');
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
app.get('/SEL_PERMISOS', (req, res) => {
    pool.query('call SEL_TBL_PERMISOS()', (err, rows, fields) => {
        if (!err) {
            res.status(200).json(rows[0]);
        } else {
            console.log(err);
        }
    });
});


// insertar a la tabla PERMISOS
app.post('/POST_PERMISOS', (req, res) => {
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

    pool.query("CALL INS_TBL_PERMISOS(?,?,?,?,?,?,?,?,?,?)", [
	  P_ID_ROL,
      P_ID_OBJETO,
	  P_PERMISO_INSERCION,
	  P_PERMISO_ELIMINACION,
      P_PERMISO_ACTUALIZACION,
      P_PERMISO_CONSULTAR,
	  P_FECHA_CREACION,
	  P_CREADO_POR,
	  P_FECHA_MODIFICACION,
	  P_MODIFICADO_POR], (err, rows, fields) => {

        if (!err) {
            res.send("Ingresado correctamente !!");
        } else {
            console.log(err);
        }
    });
});


// Borrar a la tabla PERMISOS
app.post('/DEL_PERMISOS', (req, res) => {
    const {P_ID_PERMISO} = req.body;

    pool.query(
        "CALL DEL_TBL_PERMISOS(?)",
        [P_ID_PERMISO],
        (err, rows, fields) => {
            if (!err) {
                res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
            } else {
                if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                    res.status(400).json({
                        error: 'No se puede eliminar el Permiso porque está relacionado con otros registros.'
                    });
                } else {
                    res.status(500).json({
                        error: 'Ocurrió un error al intentar eliminar el Permiso.'
                    });
                }
                console.log(err);
            }
        }
    );
});


// ACTUALIZAR a la tabla PERMISOS
app.post('/PUT_PERMISOS', (req, res) => {
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

    pool.query("CALL UPD_TBL_PERMISOS (?,?,?,?,?,?,?,?,?,?,?)", [
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
	  P_MODIFICADO_POR], (err, rows, fields) => {

        if (!err) {
            res.send("Actualizado correctamente !!");
        } else {
            console.log(err);
        }
    });
});



//  ***TABLA BITACORA_VISITA ***
app.get('/SEL_BITACORA_VISITA', (req, res) => {
    pool.query('call SEL_TBL_BITACORA_VISITA()', (err, rows, fields) => {
        if (!err) {
            res.status(200).json(rows[0]);
        } else {
            console.log(err);
        }
    });
});

// insertar a la tabla BITACORA_VISITA
app.post('/POST_BITACORA_VISITA', (req, res) => {
    const {
        P_ID_PERSONA,
        P_ID_VISITANTE,
        P_NUM_PERSONA,
        P_NUM_PLACA,
		P_FECHA_HORA
    } = req.body;

    pool.query("CALL INS_TBL_BITACORA_VISITA(?,?,?,?,?)", [P_ID_PERSONA,
        P_ID_VISITANTE,
        P_NUM_PERSONA,
        P_NUM_PLACA,
		P_FECHA_HORA], (err, rows, fields) => {

        if (!err) {
            res.send("Ingresado correctamente !!");
        } else {
            console.log(err);
        }
    });
});


// Borrar a la tabla BITACORA_VISITA
app.post('/DEL_BITACORA_VISITA', (req, res) => {
    const {P_ID_BITACORA_VISITA} = req.body;

    pool.query(
        "CALL DEL_TBL_BITACORA_VISITA(?)",
        [P_ID_BITACORA_VISITA],
        (err, rows, fields) => {
            if (!err) {
                res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
            } else {
                if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                    res.status(400).json({
                        error: 'No se puede eliminar el Registro porque está relacionado con otros registros.'
                    });
                } else {
                    res.status(500).json({
                        error: 'Ocurrió un error al intentar eliminar el Registro.'
                    });
                }
                console.log(err);
            }
        }
    );
});


// ACTUALIZAR a la tabla BITACORA_VISITA
app.post('/PUT_BITACORA_VISITA', (req, res) => {
    const {
        P_ID_BITACORA_VISITA,
	    P_ID_PERSONA,
        P_ID_VISITANTE,
        P_NUM_PERSONA,
        P_NUM_PLACA,
		P_FECHA_HORA
    } = req.body;

    pool.query("CALL UPD_TBL_BITACORA_VISITA (?,?,?,?,?,?)", [P_ID_BITACORA_VISITA,
	    P_ID_PERSONA,
        P_ID_VISITANTE,
        P_NUM_PERSONA,
        P_NUM_PLACA,
		P_FECHA_HORA], (err, rows, fields) => {

        if (!err) {
            res.send("Actualizado correctamente !!");
        } else {
            console.log(err);
        }
    });
});

//  ***TABLAS CHRISTOPHER ***
//  ***TABLA ESTADO_PERSONA ***

//Select <-> Get ESTADO_PERSONA con Procedimiento almacenado
app.get('/SEL_ESTADO_PERSONA', (req, res) => {
    pool.query('call SEL_TBL_ESTADO_PERSONA()', (err, rows, fields) => {
        if (!err) {
            res.status(200).json(rows[0]);
        } else {
            console.log(err);
        }
    });
});



// insertar a la tabla ESTADO_PERSONA
app.post('/POST_ESTADO_PERSONA', (req, res) => {
    const {
        P_DESCRIPCION
    } = req.body;

    pool.query("CALL INS_TBL_ESTADO_PERSONA (?)", [ P_DESCRIPCION
       ], (err, rows, fields) => {

        if (!err) {
            res.send("Ingresado correctamente !!");
        } else {
            console.log(err);
        }
    });
});

// Eliminar la tabla ESTADO_PERSONA
app.post('/DEL_ESTADO_PERSONA', (req, res) => {
    const { P_ID_ESTADO_PERSONA } = req.body;

    pool.query(
        "CALL DEL_TBL_ESTADO_PERSONA(?)",
        [P_ID_ESTADO_PERSONA],
        (err, rows, fields) => {
            if (!err) {
                res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
            } else {
                if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                    res.status(400).json({
                        error: 'No se puede eliminar el Estado porque está relacionado con otros registros.'
                    });
                } else {
                    res.status(500).json({
                        error: 'Ocurrió un error al intentar Estado el Usuario.'
                    });
                }
                console.log(err);
            }
        }
    );
});

// ACTUALIZAR a la tabla ESTADO_PERSONA
app.post('/PUT_ESTADO_PERSONA', (req, res) => {
    const {
        P_ID_ESTADO_PERSONA,
        P_DESCRIPCION

    } = req.body;

    pool.query("CALL UPD_TBL_ESTADO_PERSONA (?,?)", [ P_ID_ESTADO_PERSONA,
        P_DESCRIPCION
        ], (err, rows, fields) => {

        if (!err) {
            res.send("Actualizado correctamente !!");
        } else {
            console.log(err);
        }
    });
});




//  ***TABLA TBL_OBJETOS ***

//Select <-> Get TBL_OBJETOS con Procedimiento almacenado
app.get('/SEL_TBL_OBJETOS', (req, res) => {
    pool.query('call SEL_TBL_OBJETOS()', (err, rows, fields) => {
        if (!err) {
            res.status(200).json(rows[0]);
        } else {
            console.log(err);
        }
    });
});

// insertar a la tabla TBL_OBJETOS
app.post('/POST_TBL_OBJETOS', (req, res) => {
    const {
        P_OBJETO,
        P_DESCRIPCION,
        P_TIPO_OBJETO
    } = req.body;

    pool.query("CALL INS_TBL_OBJETOS (?,?,?)", [ P_OBJETO, P_DESCRIPCION, P_TIPO_OBJETO
       ], (err, rows, fields) => {

        if (!err) {
            res.send("Ingresado correctamente !!");
        } else {
            console.log(err);
        }
    });
});


// Eliminar la tabla TBL_OBJETOS
app.post('/DEL_TBL_OBJETOS', (req, res) => {
    const { P_ID_OBJETO } = req.body;

    pool.query(
        "CALL DEL_TBL_OBJETOS(?)",
        [P_ID_OBJETO],
        (err, rows, fields) => {
            if (!err) {
                res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
            } else {
                if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                    res.status(400).json({
                        error: 'No se puede eliminar el Objeto porque está relacionado con otros registros.'
                    });
                } else {
                    res.status(500).json({
                        error: 'Ocurrió un error al intentar eliminar el Objeto.'
                    });
                }
                console.log(err);
            }
        }
    );
});

// ACTUALIZAR a la tabla TBL_OBJETOS
app.post('/PUT_TBL_OBJETOS', (req, res) => {
    const {
        P_ID_OBJETO,
        P_OBJETO,
        P_DESCRIPCION,
        P_TIPO_OBJETO

    } = req.body;

    pool.query("CALL UPD_TBL_OBJETOS (?,?,?,?)", [ P_ID_OBJETO,
        P_OBJETO,P_DESCRIPCION,P_TIPO_OBJETO
        ], (err, rows, fields) => {

        if (!err) {
            res.send("Actualizado correctamente !!");
        } else {
            console.log(err);
        }
    });
});

//  ***TABLA REGVISITAS ***

//Select <-> Get REGVISITAS con Procedimiento almacenado
app.get('/SEL_REGVISITAS', (req, res) => {
    pool.query('call SEL_TBL_REGVISITAS()', (err, rows, fields) => {
        if (!err) {
            res.status(200).json(rows[0]);
        } else {
            console.log(err);
        }
    });
});

// insertar a la tabla REGVISITAS
app.post('/POST_REGVISITAS', (req, res) => {
    const {
        P_ID_PERSONA,
        P_NOMBRE_VISITANTE,
        P_DNI_VISITANTE,
		P_NUM_PERSONAS,
        P_NUM_PLACA,
        P_FECHA_HORA
    } = req.body;

    pool.query("CALL INS_TBL_REGVISITAS (?,?,?,?,?,?)", [ 
        P_ID_PERSONA,
        P_NOMBRE_VISITANTE,
        P_DNI_VISITANTE,
        P_NUM_PERSONAS,
        P_NUM_PLACA,
        P_FECHA_HORA
       ], (err, rows, fields) => {

        if (!err) {
            res.send("Ingresado correctamente !!");
        } else {
            console.log(err);
        }
    });
});


// Eliminar la tabla REGVISITAS
app.post('/DEL_REGVISITAS', (req, res) => {
    const { P_ID_VISITANTE } = req.body;

    pool.query(
        "CALL DEL_TBL_REGVISITAS(?)",
        [P_ID_VISITANTE],
        (err, rows, fields) => {
            if (!err) {
                res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
            } else {
                if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                    res.status(400).json({
                        error: 'No se puede eliminar el Visitantes porque está relacionado con otros registros.'
                    });
                } else {
                    res.status(500).json({
                        error: 'Ocurrió un error al intentar eliminar el Visitantes.'
                    });
                }
                console.log(err);
            }
        }
    );
});

// ACTUALIZAR a la tabla REGVISITAS
app.post('/PUT_REGVISITAS', (req, res) => {
    const {
        P_ID_VISITANTE,
        P_ID_PERSONA,
        P_NOMBRE_VISITANTE,
        P_DNI_VISITANTE,
        P_NUM_PERSONAS,
        P_NUM_PLACA,
        P_FECHA_HORA

    } = req.body;

    pool.query("CALL UPD_TBL_REGVISITAS (?,?,?,?,?,?,?)", [ 
        P_ID_VISITANTE,
        P_ID_PERSONA,
        P_NOMBRE_VISITANTE,
        P_DNI_VISITANTE,
        P_NUM_PERSONAS,
        P_NUM_PLACA,
        P_FECHA_HORA
        ], (err, rows, fields) => {

        if (!err) {
            res.send("Actualizado correctamente !!");
        } else {
            console.log(err);
        }
    });
});

//  ***TABLA TBL_MS_ROLES_OBJETOS ***

//Select <-> Get TBL_MS_ROLES_OBJETOS con Procedimiento almacenado
app.get('/SEL_TBL_MS_ROLES_OBJETOS', (req, res) => {
    pool.query('call SEL_TBL_MS_ROLES_OBJETOS()', (err, rows, fields) => {
        if (!err) {
            res.status(200).json(rows[0]);
        } else {
            console.log(err);
        }
    });
});


// insertar a la tabla TBL_MS_ROLES_OBJETOS
app.post('/POST_TBL_MS_ROLES_OBJETOS', (req, res) => {
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

    pool.query("CALL INS_TBL_MS_ROLES_OBJETOS (?,?,?,?,?,?,?,?,?)", [  P_ID_OBJETOS, P_PERMISO_INSERCION,
        P_PERMISO_ELIMINACION, P_PERMISO_ACTUALIZACION, P_FECHA_CREACION, P_CREADO_POR, P_FECHA_MODIFICACION, P_MODIFICADO_POR, P_PERMISO_CONSULTAR
       ], (err, rows, fields) => {

        if (!err) {
            res.send("Ingresado correctamente !!");
        } else {
            console.log(err);
        }
    });
});

// Eliminar la tabla TBL_MS_ROLES_OBJETOS
app.post('/DEL_TBL_MS_ROLES_OBJETOS', (req, res) => {
    const { P_ID_ROL } = req.body;

    pool.query(
        "CALL DEL_TBL_MS_ROLES_OBJETOS(?)",
        [P_ID_ROL],
        (err, rows, fields) => {
            if (!err) {
                res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
            } else {
                if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                    res.status(400).json({
                        error: 'No se puede eliminar el Objeto porque está relacionado con otros registros.'
                    });
                } else {
                    res.status(500).json({
                        error: 'Ocurrió un error al intentar eliminar el Objeto.'
                    });
                }
                console.log(err);
            }
        }
    );
});

// ACTUALIZAR a la tabla TBL_MS_ROLES_OBJETOS
app.post('/PUT_TBL_MS_ROLES_OBJETOS', (req, res) => {
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

    pool.query("CALL UPD_TBL_MS_ROLES_OBJETOS (?,?,?,?,?,?,?,?,?,?)", [ P_ID_ROL,
        P_ID_OBJETOS,
        P_PERMISO_INSERCION,
        P_PERMISO_ELIMINACION,
        P_PERMISO_ACTUALIZACION,
        P_FECHA_CREACION,
        P_CREADO_POR,
        P_FECHA_MODIFICACION,
        P_MODIFICADO_POR,
        P_PERMISO_CONSULTAR], (err, rows, fields) => {

        if (!err) {
            res.send("Actualizado correctamente !!");
        } else {
            console.log(err);
        }
    });
});


//  ***TABLAS WILSON MOYA ***

//  ***TABLA TIPO_CONTACTO ***

//Select <-> Get TIPO_CONTACTO con Procedimiento almacenado
app.get('/SEL_TIPO_CONTACTO', (req, res) => {
    pool.query('call SEL_TBL_TIPO_CONTACTO()', (err, rows, fields) => {
        if (!err) {
            res.status(200).json(rows[0]);
        } else {
            console.log(err);
        }
    });
});

// insertar a la tabla TIPO_CONTACTO
app.post('/POST_TIPO_CONTACTO', (req, res) => {
    const {
        P_DESCRIPCION
    } = req.body;

    pool.query("CALL INS_TBL_TIPO_CONTACTO (?)", [   
        P_DESCRIPCION

    ], (err, rows, fields) => {

        if (!err) {
            res.send("Ingresado correctamente !!");
        } else {
            console.log(err);
        }
    });
});

// Borrar a la tabla TIPO_CONTACTO
app.post('/DEL_TIPO_CONTACTO', (req, res) => {
    const { P_ID_TIPO_CONTACTO } = req.body;

    pool.query(
        "CALL DEL_TBL_TIPO_CONTACTO(?)",
        [P_ID_TIPO_CONTACTO],
        (err, rows, fields) => {
            if (!err) {
                res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
            } else {
                if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                    res.status(400).json({
                        error: 'No se puede eliminar el Tipo de Contacto porque está relacionado con otros registros.'
                    });
                } else {
                    res.status(500).json({
                        error: 'Ocurrió un error al intentar eliminar el Tipo de Contacto.'
                    });
                }
                console.log(err);
            }
        }
    );
});


// ACTUALIZAR a la tabla TIPO_CONTACTO
app.post('/PUT_TIPO_CONTACTO', (req, res) => {
    const {
        P_ID_TIPO_CONTACTO,
        P_DESCRIPCION
    } = req.body;

    pool.query("CALL UPD_TBL_TIPO_CONTACTO (?,?)", [ 
        P_ID_TIPO_CONTACTO,
        P_DESCRIPCION
    ], (err, rows, fields) => {

        if (!err) {
            res.send("Actualizado correctamente !!");
        } else {
            console.log(err);
        }
    });
});







//  ***TABLA TIPO_CONDOMINIO***

//Select <-> Get TIPO_CONDOMINIO con Procedimiento almacenado
app.get('/SEL_TIPO_CONDOMINIO', (req, res) => {
    pool.query('call SEL_TBL_TIPO_CONDOMINIO()', (err, rows, fields) => {
        if (!err) {
            res.status(200).json(rows[0]);
        } else {
            console.log(err);
        }
    });
});

// insertar a la tabla TIPO_CONDOMINIO
app.post('/POST_TIPO_CONDOMINIO', (req, res) => {
    const {
        P_DESCRIPCION
    } = req.body;

    pool.query("CALL INS_TBL_TIPO_CONDOMINIO (?)", [   
        P_DESCRIPCION

    ], (err, rows, fields) => {

        if (!err) {
            res.send("Ingresado correctamente !!");
        } else {
            console.log(err);
        }
    });
});

// Borrar a la tabla TIPO_CONDOMINIO
app.post('/DEL_TIPO_CONDOMINIO', (req, res) => {
    const { P_ID_TIPO_CONDOMINIO } = req.body;

    pool.query(
        "CALL DEL_TBL_TIPO_CONDOMINIO(?)",
        [P_ID_TIPO_CONDOMINIO],
        (err, rows, fields) => {
            if (!err) {
                res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
            } else {
                if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                    res.status(400).json({
                        error: 'No se puede eliminar el Tipo de Condominio porque está relacionado con otros registros.'
                    });
                } else {
                    res.status(500).json({
                        error: 'Ocurrió un error al intentar eliminar el Tipo de Condominio.'
                    });
                }
                console.log(err);
            }
        }
    );
});


// ACTUALIZAR a la tabla TIPO_CONDOMINIO
app.post('/PUT_TIPO_CONDOMINIO', (req, res) => {
    const {
        P_ID_TIPO_CONDOMINIO,
        P_DESCRIPCION
    } = req.body;

    pool.query("CALL UPD_TBL_TIPO_CONDOMINIO (?,?)", [ 
        P_ID_TIPO_CONDOMINIO,
        P_DESCRIPCION
    ], (err, rows, fields) => {

        if (!err) {
            res.send("Actualizado correctamente !!");
        } else {
            console.log(err);
        }
    });
});





//  ***TABLA ESTADO_USUARIO***

//Select <-> Get ESTADO_USUARIO con Procedimiento almacenado
app.get('/SEL_ESTADO_USUARIO', (req, res) => {
    pool.query('call SEL_TBL_ESTADO_USUARIO()', (err, rows, fields) => {
        if (!err) {
            res.status(200).json(rows[0]);
        } else {
            console.log(err);
        }
    });
});

// insertar a la tabla TIPO_CONDOMINIO
app.post('/POST_ESTADO_USUARIO', (req, res) => {
    const {
        P_DESCRIPCION
    } = req.body;

    pool.query("CALL INS_TBL_ESTADO_USUARIO (?)", [   
        P_DESCRIPCION

    ], (err, rows, fields) => {

        if (!err) {
            res.send("Ingresado correctamente !!");
        } else {
            console.log(err);
        }
    });
});

// Borrar a la tabla ESTADO_USUARIO
app.post('/DEL_ESTADO_USUARIO', (req, res) => {
    const { P_ID_ESTADO_USUARIO } = req.body;

    pool.query(
        "CALL DEL_TBL_ESTADO_USUARIO(?)",
        [P_ID_ESTADO_USUARIO],
        (err, rows, fields) => {
            if (!err) {
                res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
            } else {
                if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                    res.status(400).json({
                        error: 'No se puede eliminar el Estado porque está relacionado con otros registros.'
                    });
                } else {
                    res.status(500).json({
                        error: 'Ocurrió un error al intentar Estado el Usuario.'
                    });
                }
                console.log(err);
            }
        }
    );
});

// ACTUALIZAR a la tabla ESTADO_USUARIO
app.post('/PUT_ESTADO_USUARIO', (req, res) => {
    const {
        P_ID_ESTADO_USUARIO,
        P_DESCRIPCION
    } = req.body;

    pool.query("CALL UPD_TBL_ESTADO_USUARIO(?,?)", [ 
        P_ID_ESTADO_USUARIO,
        P_DESCRIPCION
    ], (err, rows, fields) => {

        if (!err) {
            res.send("Actualizado correctamente !!");
        } else {
            console.log(err);
        }
    });
});







//  ***TABLA TBL_MS_PARAMETROS***

//Select <-> Get TBL_MS_PARAMETROS con Procedimiento almacenado
app.get('/SEL_TBL_MS_PARAMETROS', (req, res) => {
    pool.query('call SEL_TBL_MS_PARAMETROS()', (err, rows, fields) => {
        if (!err) {
            res.status(200).json(rows[0]);
        } else {
            console.log(err);
        }
    });
});

// insertar a la tabla TBL_MS_PARAMETROS
app.post('/POST_TBL_MS_PARAMETROS', (req, res) => {
    const {
        P_ID_USUARIO,
        P_PARAMETRO,   
		P_VALOR,
        P_FECHA_CREACION,
        P_FECHA_MODIFICACION
    } = req.body;

    pool.query("CALL INS_TBL_MS_PARAMETROS (?,?,?,?,?)", [   
        P_ID_USUARIO,
        P_PARAMETRO,   
		P_VALOR,
        P_FECHA_CREACION,
        P_FECHA_MODIFICACION

    ], (err, rows, fields) => {

        if (!err) {
            res.send("Ingresado correctamente !!");
        } else {
            console.log(err);
        }
    });
});

// Borrar a la tabla TBL_MS_PARAMETROS
app.post('/DEL_TBL_MS_PARAMETROS', (req, res) => {
    const { P_ID_PARAMETRO } = req.body;

    pool.query(
        "CALL DEL_TBL_MS_PARAMETROS(?)",
        [P_ID_PARAMETRO],
        (err, rows, fields) => {
            if (!err) {
                res.status(200).json({ message: 'El registro se eliminó exitosamente.' });
            } else {
                if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                    res.status(400).json({
                        error: 'No se puede eliminar el Parametro porque está relacionado con otros registros.'
                    });
                } else {
                    res.status(500).json({
                        error: 'Ocurrió un error al intentar eliminar el Parametro.'
                    });
                }
                console.log(err);
            }
        }
    );
});

// ACTUALIZAR a la tabla TBL_MS_PARAMETROS
app.post('/PUT_TBL_MS_PARAMETROS', (req, res) => {
    console.log(req.body.P_VALOR);  // Verificar que la ruta de la imagen se reciba correctamente

    const {

        P_ID_PARAMETRO,
        P_ID_USUARIO,
        P_PARAMETRO,   
		P_VALOR,
        P_FECHA_CREACION,
        P_FECHA_MODIFICACION
    } = req.body;

    pool.query("CALL UPD_TBL_MS_PARAMETROS(?,?,?,?,?,?)", [ 
        P_ID_PARAMETRO,
        P_ID_USUARIO,
        P_PARAMETRO,   
		P_VALOR,
        P_FECHA_CREACION,
        P_FECHA_MODIFICACION
    ], (err, rows, fields) => {

        if (!err) {
            res.send("Actualizado correctamente !!");
        } else {
            console.log(err);
        }
    });
});






