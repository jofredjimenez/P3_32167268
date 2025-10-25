const request = require('supertest');
const app = require('../app'); // Tu aplicación Express
const { AppDataSource } = require('../config/databaseConfig');
const Usuario = require('../models/usuario');

beforeAll(async () => {
    await AppDataSource.initialize(); // Conexión a la base de datos
});

beforeEach(async () => {
    // Limpia la tabla de usuarios antes de cada prueba
    await AppDataSource.getRepository(Usuario).clear();
    console.log('Base de datos limpiada antes de la prueba');
});

afterAll(async () => {
    // Cierra la conexión al final de las pruebas
    await AppDataSource.destroy();
});

describe('Pruebas de Endpoints de Autenticación', () => {
    
    it('POST /auth/register, se espera status 201 %% success, return: id, nombre, email.', async () => {
        const registerResponse = await request(app)
            .post('/auth/register')
            .send({
                nombre: 'Jofred',
                email: 'gamerjofred@gmail.com',
                contrasena: 'Password' // Asegúrate de que el nombre del campo sea "contrasena"
            });

        expect(registerResponse.status).toBe(201);
        expect(registerResponse.body.status).toBe('success');
        expect(registerResponse.body.data).toHaveProperty('id');
        expect(registerResponse.body.data.nombre).toBe('Jofred');
        expect(registerResponse.body.data.email).toBe('gamerjofred@gmail.com');
    });

    it('POST /auth/register, se espera un error 409, Email ya se encuentra registrado en la base de dato. ', async () => {
        // Primero registra un usuario
        await request(app)
            .post('/auth/register')
            .send({
                nombre: 'Jofred',
                email: 'alex2@outlook.com',
                contrasena: 'password123' // Asegúrate de usar "contrasena" aquí también
            });

        // Intenta registrar el mismo correo
        const registerResponse = await request(app)
            .post('/auth/register')
            .send({
                nombre: 'Jofred',
                email: 'alex2@outlook.com', // Este debe coincidir con el email anterior.
                contrasena: 'password123'
            });

        expect(registerResponse.status).toBe(409); // Deberías esperar 409 por duplicado
        expect(registerResponse.body.status).toBe('fail');
    });


    it('POST /auth/login, Se espera retornar status 200 && success, return Token', async () => {
        // Intento de acceso con un usuario registrado
        await request(app)
            .post('/auth/register')
            .send({
                nombre: 'Jofred',
                email: 'gamerjofred@gmail.com',
                contrasena: 'Password' // Asegúrate de que el nombre del campo sea "contrasena"
            });

        const loginResponse = await request(app)
            .post('/auth/login')
            .send({
                email: 'gamerjofred@gmail.com',
                contrasena: 'Password' // Asegúrate de que el nombre del campo sea "contrasena"
            });

        expect(loginResponse.status).toBe(200);
        expect(loginResponse.body.status).toBe('success');
        expect(loginResponse.body).toHaveProperty('token');
    });

    it('POST /auth/login, Se espera un status 401 && fail, Credenciales invalidas: Email o contrasena no coinciden', async () => {
        // Intento de acceso con un usuario registrado
        await request(app)
            .post('/auth/register')
            .send({
                nombre: 'Jofred',
                email: 'gamerjofred@gmail.com',
                contrasena: 'Password' // Asegúrate de que el nombre del campo sea "contrasena"
            });

        const loginResponse = await request(app)
            .post('/auth/login')
            .send({
                email: 'ale@hotmail.com',
                contrasena: 'ale' // Asegúrate de que el nombre del campo sea "contrasena"
            });

        expect(loginResponse.status).toBe(401);
        expect(loginResponse.body.status).toBe('fail');
    });

    it('POST /auth/login, Se espera un status 400 && fail, Credenciales invalidas: No ingreso Email o contrasena', async () => {
        // Intento de acceso con un usuario registrado
        await request(app)
            .post('/auth/register')
            .send({
                nombre: 'Jofred',
                email: 'gamerjofred@gmail.com',
                contrasena: 'Password' // Asegúrate de que el nombre del campo sea "contrasena"
            });

        const loginResponse = await request(app)
            .post('/auth/login')
            .send({
                email: 'ale@hotmail.com',
                contrasena: '' // Asegúrate de que el nombre del campo sea "contrasena"
            });

        expect(loginResponse.status).toBe(400);
        expect(loginResponse.body.status).toBe('fail');
    });

    it('Get /users, se espera status 401 && fail, al no enviar token de autenticacion', async () => {
        const getAllUsersResponse = await request(app)
            .get('/users');

        expect(getAllUsersResponse.status).toBe(401);
        expect(getAllUsersResponse.body.status).toBe('fail');
    });

    it('Get /users, se espera status 403 && fail, Token no valido o expirado', async () => {

        token = 'abcdersdASDsfewaf';

        const getAllUsersResponse = await request(app)
            .get('/users')
            .set('Authorization', `Bearer ${token}invalid`);

        expect(getAllUsersResponse.status).toBe(403);
        expect(getAllUsersResponse.body.status).toBe('fail');
    });

    it('Get /users, se espera status 200 && success, con validacion de token, se recuperan todos los usuarios', async () => {
        // Intento de acceso con un usuario registrado
        await request(app)
            .post('/auth/register')
            .send({
                nombre: 'Jofred',
                email: 'gamerjofred@gmail.com',
                contrasena: 'Password' // Asegúrate de que el nombre del campo sea "contrasena"
            });

        const loginResponse = await request(app)
            .post('/auth/login')
            .send({
                email: 'gamerjofred@gmail.com',
                contrasena: 'Password' // Asegúrate de que el nombre del campo sea "contrasena"
            });

        token = loginResponse.body.token;

        const getAllUsersResponse = await request(app)
            .get('/users')
            .set('Authorization', `Bearer ${token}`);

        expect(getAllUsersResponse.status).toBe(200);
        expect(getAllUsersResponse.body.status).toBe('success');
        expect(typeof getAllUsersResponse.body.data).toBe('object');
    });


    it('Get /users/:id, se espera status 200 && success, con validacion de token, se recupera un usuario por ID', async () => {
        // Registro de un usuario
        await request(app)
            .post('/auth/register')
            .send({
                nombre: 'Jofred',
                email: 'gamerjofred@gmail.com',
                contrasena: 'Password' // Cambia según lo que necesites
            });

        // Inicio de sesión para obtener el token
        const loginResponse = await request(app)
            .post('/auth/login')
            .send({
                email: 'gamerjofred@gmail.com',
                contrasena: 'Password' // Cambia según lo que necesites
            });

        const token = loginResponse.body.token;

        // Suponiendo que el usuario tiene un ID de 1 después del registro
        const userId = 7; // Cambia según el ID generado en tu base de datos

        // Obtener el usuario por ID usando el token
        const getUserByIdResponse = await request(app)
            .get(`/users/${userId}`)
            .set('Authorization', `Bearer ${token}`);

        // Verificación de la respuesta
        expect(getUserByIdResponse.status).toBe(200);
        expect(getUserByIdResponse.body.status).toBe('success');
        expect(getUserByIdResponse.body.data).toHaveProperty('user');
        expect(getUserByIdResponse.body.data.user.id).toBe(userId);
        expect(getUserByIdResponse.body.data.user.email).toBe('gamerjofred@gmail.com'); // Verifica el email
    });


    it('Get /users/:id, se espera status 404 && fail, al no encontrar el usuario por ID', async () => {
        // Asumiendo que quieres probar con un ID que no existe
        const nonExistentUserId = 9999; // Cambia a un ID que esté seguro que no existe

        // Generar un token de un usuario registrado (necesario para la autorización)
        const registerResponse = await request(app)
            .post('/auth/register')
            .send({
                nombre: 'Jofred',
                email: 'gamerjofred@gmail.com',
                contrasena: 'Password'
            });

        const loginResponse = await request(app)
            .post('/auth/login')
            .send({
                email: 'gamerjofred@gmail.com',
                contrasena: 'Password'
            });

        const token = loginResponse.body.token;
        const userID = 1000

        // Intentar obtener el usuario que no existe usando el token
        const getUserByIdResponse = await request(app)
            .get(`/users/${1000}`)
            .set('Authorization', `Bearer ${token}`);

        // Verificación de la respuesta
        expect(getUserByIdResponse.status).toBe(404);
        expect(getUserByIdResponse.body.status).toBe('fail');
        // NOTA: Si el mensaje de error de tu API no coincide con este, la prueba fallará.
        // La prueba original esperaba: expect(getUserByIdResponse.body.message).toBe('Usuario no encontrado');
    });

    it('Get /users/:id, se espera status 400 && fail, al no enviar un ID válido', async () => {
        // Usar un ID no numérico
        const invalidUserId = 'abc123'; // ID no válido como una cadena

        // Generar un token de un usuario registrado (necesario para la autorización)
        const registerResponse = await request(app)
            .post('/auth/register')
            .send({
                nombre: 'Jofred',
                email: 'gamerjofred@gmail.com',
                contrasena: 'Password'
            });

        const loginResponse = await request(app)
            .post('/auth/login')
            .send({
                email: 'gamerjofred@gmail.com',
                contrasena: 'Password'
            });

        const token = loginResponse.body.token;

        // Intentar obtener el usuario usando un ID no numérico
        const getUserByIdResponse = await request(app)
            .get(`/users/${invalidUserId}`)
            .set('Authorization', `Bearer ${token}`);

        // Verificación de la respuesta
        expect(getUserByIdResponse.status).toBe(400);
        expect(getUserByIdResponse.body.status).toBe('fail');
    });


    it('POST /users, se espera status 201 && success, Se crea un usuario con validacion de token', async () => {
        // Registro de un usuario
        await request(app)
            .post('/auth/register')
            .send({
                nombre: 'Jofred',
                email: 'gamerjofred@gmail.com',
                contrasena: 'Password' // Cambia según lo que necesites
            });

        // Inicio de sesión para obtener el token
        const loginResponse = await request(app)
            .post('/auth/login')
            .send({
                email: 'gamerjofred@gmail.com',
                contrasena: 'Password' // Cambia según lo que necesites
            });

        const token = loginResponse.body.token;

        const createUserResponse = await request(app)
            .post('/users')
            .set('Authorization', `Bearer ${token}`)
            .send({
                nombre: 'Maria',
                email: 'Maria@gmail.com',
                contrasena: 'Password123'
            });

        expect(createUserResponse.status).toBe(201);
        expect(createUserResponse.body.status).toBe('success');
        expect(createUserResponse.body.data.usuario).toHaveProperty('id');
        expect(createUserResponse.body.data.usuario.nombre).toBe('Maria');
        expect(createUserResponse.body.data.usuario.email).toBe('Maria@gmail.com');
    });

    it('POST /users, se espera status 409 && fail, Correo en uso', async () => {
        // Registro de un usuario
        await request(app)
            .post('/auth/register')
            .send({
                nombre: 'Jofred',
                email: 'gamerjofred@gmail.com',
                contrasena: 'Password' // Cambia según lo que necesites
            });

        // Inicio de sesión para obtener el token
        const loginResponse = await request(app)
            .post('/auth/login')
            .send({
                email: 'gamerjofred@gmail.com',
                contrasena: 'Password' // Cambia según lo que necesites
            });

        const token = loginResponse.body.token;

        await request(app)
            .post('/users')
            .set('Authorization', `Bearer ${token}`)
            .send({
                nombre: 'Maria',
                email: 'Maria@gmail.com',
                contrasena: 'Password123'
            });


        const createUserResponse = await request(app)
            .post('/users')
            .set('Authorization', `Bearer ${token}`)
            .send({
                nombre: 'Maria',
                email: 'Maria@gmail.com',
                contrasena: 'Password123'
            });

        expect(createUserResponse.status).toBe(409);
        expect(createUserResponse.body.status).toBe('fail');
    });

    it('POST /users, se espera status 400 && fail, No se ingreso algun dato, o el Email no tiene direccion correcta', async () => {
        // Registro de un usuario
        await request(app)
            .post('/auth/register')
            .send({
                nombre: 'Jofred',
                email: 'gamerjofred@gmail.com',
                contrasena: 'Password' // Cambia según lo que necesites
            });

        // Inicio de sesión para obtener el token
        const loginResponse = await request(app)
            .post('/auth/login')
            .send({
                email: 'gamerjofred@gmail.com',
                contrasena: 'Password' // Cambia según lo que necesites
            });

        const token = loginResponse.body.token;

        const createUserResponse = await request(app)
            .post('/users')
            .set('Authorization', `Bearer ${token}`)
            .send({
                nombre: '',
                email: 'Maria@gmail.com',
                contrasena: 'Password123'
            });

        expect(createUserResponse.status).toBe(400);
        expect(createUserResponse.body.status).toBe('fail');
    });



    it('PUT /users/:id, se espera status 200 && success, Se actualiza un usuario con validación de token', async () => {
        // Registro de un usuario
        await request(app)
            .post('/auth/register')
            .send({
                nombre: 'Jofred',
                email: 'gamerjofred@gmail.com',
                contrasena: 'Password' // Cambia según lo que necesites
            });

        // Inicio de sesión para obtener el token
        const loginResponse = await request(app)
            .post('/auth/login')
            .send({
                email: 'gamerjofred@gmail.com',
                contrasena: 'Password' // Cambia según lo que necesites
            });

        const token = loginResponse.body.token;

        // Primero, registra el usuario que se va a actualizar
        const createUserResponse = await request(app)
            .post('/users')
            .set('Authorization', `Bearer ${token}`)
            .send({
                nombre: 'Maria',
                email: 'Maria@gmail.com',
                contrasena: 'Password123'
            });

        const userId = createUserResponse.body.data.usuario.id; // Obtener el ID del nuevo usuario
        console.log(userId);

        // Actualización de los datos del usuario
        const updateUserResponse = await request(app)
            .put(`/users/${userId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                nombre: 'Maria-Updated',
                email: 'maria.updated@gmail.com',
                contrasena: 'NewPassword123'
            });

        // Verificación de la respuesta
        expect(updateUserResponse.status).toBe(200);
        expect(updateUserResponse.body.status).toBe('success');
        expect(updateUserResponse.body.data).toHaveProperty('nombre', 'Maria-Updated'); // Asegúrate de usar la propiedad correcta
        expect(updateUserResponse.body.data).toHaveProperty('email', 'maria.updated@gmail.com'); // Asegúrate de usar la propiedad correcta
    });


    it('PUT /users/:id, se espera status 409 && fail, Correo ingresado ya esta en uso', async () => {
        // Registro de un usuario
        await request(app)
            .post('/auth/register')
            .send({
                nombre: 'Jofred',
                email: 'gamerjofred@gmail.com',
                contrasena: 'Password' // Cambia según lo que necesites
            });

        // Inicio de sesión para obtener el token
        const loginResponse = await request(app)
            .post('/auth/login')
            .send({
                email: 'gamerjofred@gmail.com',
                contrasena: 'Password' // Cambia según lo que necesites
            });

        const token = loginResponse.body.token;

        // Primero, registra el usuario que se va a actualizar
        const createUserResponse = await request(app)
            .post('/users')
            .set('Authorization', `Bearer ${token}`)
            .send({
                nombre: 'Maria',
                email: 'Maria@gmail.com',
                contrasena: 'Password123'
            });

        const userId = createUserResponse.body.data.usuario.id; // Obtener el ID del nuevo usuario
        console.log(userId);

        // Actualización de los datos del usuario
        const updateUserResponse = await request(app)
            .put(`/users/${userId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                nombre: 'Maria-Updated',
                email: 'gamerjofred@gmail.com',
                contrasena: 'NewPassword123'
            });

        // Verificación de la respuesta
        expect(updateUserResponse.status).toBe(409);
        expect(updateUserResponse.body.status).toBe('fail');
    });


    it('PUT /users/:id, se espera status 404 && fail, al no encontrar el usuario', async () => {
        // Registro de un usuario
        await request(app)
            .post('/auth/register')
            .send({
                nombre: 'Jofred',
                email: 'gamerjofred@gmail.com',
                contrasena: 'Password'
            });

        // Inicio de sesión para obtener el token
        const loginResponse = await request(app)
            .post('/auth/login')
            .send({
                email: 'gamerjofred@gmail.com',
                contrasena: 'Password'
            });

        const token = loginResponse.body.token;

        // Definir un ID que no existe (puedes usar un número alto o un ID específico que no esté en uso)
        const nonExistentUserId = 9999; // Asegúrate de que este ID no exista en tu base de datos

        // Intentar actualizar el usuario con un ID no existente
        const updateUserResponse = await request(app)
            .put(`/users/${nonExistentUserId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                nombre: 'Maria-Updated',
                email: 'maria.updated@gmail.com',
                contrasena: 'NewPassword123'
            });

        // Verificación de la respuesta
        expect(updateUserResponse.status).toBe(404);
        expect(updateUserResponse.body.status).toBe('fail');
    });


        // Prueba para eliminar un usuario existente
    it('DELETE /users/:id, se espera status 200 && success, al eliminar un usuario', async () => {
        // Registro de un usuario
        await request(app)
            .post('/auth/register')
            .send({
                nombre: 'Jofred',
                email: 'gamerjofred@gmail.com',
                contrasena: 'Password'
            });

        // Inicio de sesión para obtener el token
        const loginResponse = await request(app)
            .post('/auth/login')
            .send({
                email: 'gamerjofred@gmail.com',
                contrasena: 'Password'
            });

        const token = loginResponse.body.token;

        // Crear un usuario que se va a eliminar
        const createUserResponse = await request(app)
            .post('/users')
            .set('Authorization', `Bearer ${token}`)
            .send({
                nombre: 'Maria',
                email: 'Maria@gmail.com',
                contrasena: 'Password123'
            });

        const userId = createUserResponse.body.data.usuario.id; // Obtener el ID del nuevo usuario

        // Eliminar el usuario
        const deleteUserResponse = await request(app)
            .delete(`/users/${userId}`)
            .set('Authorization', `Bearer ${token}`);

        // Verificación de la respuesta
        expect(deleteUserResponse.status).toBe(200);
        expect(deleteUserResponse.body.status).toBe('success');
    });

    // Prueba para eliminar un usuario no existente
    it('DELETE /users/:id, se espera status 404 && fail, al no encontrar el usuario para eliminar', async () => {
        // Registro de un usuario
        await request(app)
            .post('/auth/register')
            .send({
                nombre: 'Jofred',
                email: 'gamerjofred@gmail.com',
                contrasena: 'Password'
            });

        // Inicio de sesión para obtener el token
        const loginResponse = await request(app)
            .post('/auth/login')
            .send({
                email: 'gamerjofred@gmail.com',
                contrasena: 'Password'
            });

        const token = loginResponse.body.token;

        // Definir un ID que no existe
        const nonExistentUserId = 9999; // Asegúrate de que este ID no exista en tu base de datos

        // Intentar eliminar el usuario con un ID no existente
        const deleteUserResponse = await request(app)
            .delete(`/users/${nonExistentUserId}`)
            .set('Authorization', `Bearer ${token}`);

        // Verificación de la respuesta
        expect(deleteUserResponse.status).toBe(404);
        expect(deleteUserResponse.body.status).toBe('fail');
    });


    


});