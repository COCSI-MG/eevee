import app from './server';
import request from 'supertest';

describe('Express Example test', () => {
    it('should respond with Hello World', async () => {
        const response = await request(app).get('/');
        expect(response.text).toBe('Hello World from Express!');
    });
});
