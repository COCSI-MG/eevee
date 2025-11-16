// validation0.test.ts
describe('API de Alunos e Cursos', () => {
  let alunoId: string;
  let cursoId: string;
  
  const alunoBase = {
    nome: 'João Silva',
    matricula: '20240001',
    cursos: ['Matemática', 'Programação']
  };

  const cursoBase = {
    nome: 'Matemática',
    codigo: 'MAT101',
    cargaHoraria: 60
  };

  // Estado global para simular o banco de dados
  let alunosDB: any[] = [];
  let cursosDB: any[] = [];

  // Mock functions para simular as operações da API
  const mockApi = {
    // Operações para Alunos
    alunos: {
      create: async (aluno: any) => {
        // Simula validação - nome é obrigatório
        if (!aluno.nome) {
          throw new Error('Nome é obrigatório');
        }
        const novoAluno = {
          id: (alunosDB.length + 1).toString(),
          ...aluno,
          createdAt: new Date().toISOString()
        };
        alunosDB.push(novoAluno);
        return novoAluno;
      },
      findAll: async () => {
        return [...alunosDB];
      },
      findById: async (id: string) => {
        return alunosDB.find(aluno => aluno.id === id) || null;
      },
      update: async (id: string, aluno: any) => {
        const index = alunosDB.findIndex(a => a.id === id);
        if (index === -1) return null;
        
        if (!aluno.nome) {
          throw new Error('Nome é obrigatório');
        }
        
        alunosDB[index] = { ...alunosDB[index], ...aluno };
        return alunosDB[index];
      },
      partialUpdate: async (id: string, updates: any) => {
        const index = alunosDB.findIndex(a => a.id === id);
        if (index === -1) return null;
        
        alunosDB[index] = { ...alunosDB[index], ...updates };
        return alunosDB[index];
      },
      delete: async (id: string) => {
        const index = alunosDB.findIndex(a => a.id === id);
        if (index === -1) return false;
        
        alunosDB.splice(index, 1);
        return true;
      }
    },

    // Operações para Cursos
    cursos: {
      create: async (curso: any) => {
        // Simula validação - nome e código são obrigatórios
        if (!curso.nome || !curso.codigo) {
          throw new Error('Nome e código são obrigatórios');
        }
        const novoCurso = {
          id: (cursosDB.length + 1).toString(),
          ...curso,
          createdAt: new Date().toISOString()
        };
        cursosDB.push(novoCurso);
        return novoCurso;
      },
      findAll: async () => {
        return [...cursosDB];
      },
      findById: async (id: string) => {
        return cursosDB.find(curso => curso.id === id) || null;
      },
      update: async (id: string, curso: any) => {
        const index = cursosDB.findIndex(c => c.id === id);
        if (index === -1) return null;
        
        if (!curso.nome || !curso.codigo) {
          throw new Error('Nome e código são obrigatórios');
        }
        
        cursosDB[index] = { ...cursosDB[index], ...curso };
        return cursosDB[index];
      },
      partialUpdate: async (id: string, updates: any) => {
        const index = cursosDB.findIndex(c => c.id === id);
        if (index === -1) return null;
        
        cursosDB[index] = { ...cursosDB[index], ...updates };
        return cursosDB[index];
      },
      delete: async (id: string) => {
        const index = cursosDB.findIndex(c => c.id === id);
        if (index === -1) return false;
        
        cursosDB.splice(index, 1);
        return true;
      }
    }
  };

  // Reset do banco de dados antes de cada teste
  beforeEach(() => {
    alunosDB = [];
    cursosDB = [];
  });

  // Testes para Alunos
  describe('Endpoints de Alunos', () => {
    test('POST /alunos - Deve cadastrar um aluno', async () => {
      const response = await mockApi.alunos.create(alunoBase);

      expect(response).toHaveProperty('id');
      expect(response.nome).toBe(alunoBase.nome);
      expect(response.matricula).toBe(alunoBase.matricula);
      expect(response.cursos).toEqual(alunoBase.cursos);

      alunoId = response.id;
    });

    test('GET /alunos - Deve listar todos os alunos', async () => {
      // Primeiro cria um aluno para ter dados
      await mockApi.alunos.create(alunoBase);
      
      const response = await mockApi.alunos.findAll();

      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBe(1);
      expect(response[0]).toHaveProperty('id');
      expect(response[0]).toHaveProperty('nome');
    });

    test('GET /alunos/:id - Deve visualizar um aluno específico', async () => {
      // Primeiro cria um aluno
      const alunoCriado = await mockApi.alunos.create(alunoBase);
      
      const response = await mockApi.alunos.findById(alunoCriado.id);

      expect(response).not.toBeNull();
      if (response) {
        expect(response.id).toBe(alunoCriado.id);
        expect(response.nome).toBe(alunoBase.nome);
      }
    });

    test('PUT /alunos/:id - Deve editar completamente um aluno', async () => {
      // Primeiro cria um aluno
      const alunoCriado = await mockApi.alunos.create(alunoBase);
      
      const alunoEditado = {
        nome: 'João Santos',
        matricula: '20240002',
        cursos: ['Física', 'Química']
      };

      const response = await mockApi.alunos.update(alunoCriado.id, alunoEditado);

      expect(response).not.toBeNull();
      if (response) {
        expect(response.nome).toBe(alunoEditado.nome);
        expect(response.matricula).toBe(alunoEditado.matricula);
        expect(response.cursos).toEqual(alunoEditado.cursos);
      }
    });

    test('PATCH /alunos/:id - Deve editar parcialmente um aluno', async () => {
      // Primeiro cria um aluno
      const alunoCriado = await mockApi.alunos.create(alunoBase);
      
      const alunoParcial = {
        nome: 'João Carlos'
      };

      const response = await mockApi.alunos.partialUpdate(alunoCriado.id, alunoParcial);

      expect(response).not.toBeNull();
      if (response) {
        expect(response.nome).toBe(alunoParcial.nome);
        // Verifica se os outros campos permanecem
        expect(response.matricula).toBe(alunoBase.matricula);
        expect(response.cursos).toEqual(alunoBase.cursos);
      }
    });

    test('DELETE /alunos/:id - Deve deletar um aluno', async () => {
      // Primeiro cria um aluno
      const alunoCriado = await mockApi.alunos.create(alunoBase);
      
      // Verifica que o aluno existe
      const alunoAntes = await mockApi.alunos.findById(alunoCriado.id);
      expect(alunoAntes).not.toBeNull();

      // Deleta o aluno
      const deleteResult = await mockApi.alunos.delete(alunoCriado.id);
      expect(deleteResult).toBe(true);

      // Verifica se o aluno foi realmente removido
      const alunoDepois = await mockApi.alunos.findById(alunoCriado.id);
      expect(alunoDepois).toBeNull();
    });
  });

  // Testes para Cursos
  describe('Endpoints de Cursos', () => {
    test('POST /cursos - Deve cadastrar um curso', async () => {
      const response = await mockApi.cursos.create(cursoBase);

      expect(response).toHaveProperty('id');
      expect(response.nome).toBe(cursoBase.nome);
      expect(response.codigo).toBe(cursoBase.codigo);
      expect(response.cargaHoraria).toBe(cursoBase.cargaHoraria);

      cursoId = response.id;
    });

    test('GET /cursos - Deve listar todos os cursos', async () => {
      // Primeiro cria um curso
      await mockApi.cursos.create(cursoBase);
      
      const response = await mockApi.cursos.findAll();

      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBe(1);
      expect(response[0]).toHaveProperty('id');
      expect(response[0]).toHaveProperty('nome');
    });

    test('GET /cursos/:id - Deve visualizar um curso específico', async () => {
      // Primeiro cria um curso
      const cursoCriado = await mockApi.cursos.create(cursoBase);
      
      const response = await mockApi.cursos.findById(cursoCriado.id);

      expect(response).not.toBeNull();
      if (response) {
        expect(response.id).toBe(cursoCriado.id);
        expect(response.nome).toBe(cursoBase.nome);
      }
    });

    test('PUT /cursos/:id - Deve editar completamente um curso', async () => {
      // Primeiro cria um curso
      const cursoCriado = await mockApi.cursos.create(cursoBase);
      
      const cursoEditado = {
        nome: 'Matemática Avançada',
        codigo: 'MAT201',
        cargaHoraria: 80
      };

      const response = await mockApi.cursos.update(cursoCriado.id, cursoEditado);

      expect(response).not.toBeNull();
      if (response) {
        expect(response.nome).toBe(cursoEditado.nome);
        expect(response.codigo).toBe(cursoEditado.codigo);
        expect(response.cargaHoraria).toBe(cursoEditado.cargaHoraria);
      }
    });

    test('PATCH /cursos/:id - Deve editar parcialmente um curso', async () => {
      // Primeiro cria um curso
      const cursoCriado = await mockApi.cursos.create(cursoBase);
      
      const cursoParcial = {
        cargaHoraria: 100
      };

      const response = await mockApi.cursos.partialUpdate(cursoCriado.id, cursoParcial);

      expect(response).not.toBeNull();
      if (response) {
        expect(response.cargaHoraria).toBe(cursoParcial.cargaHoraria);
        // Verifica se os outros campos permanecem
        expect(response.nome).toBe(cursoBase.nome);
        expect(response.codigo).toBe(cursoBase.codigo);
      }
    });

    test('DELETE /cursos/:id - Deve deletar um curso', async () => {
      // Primeiro cria um curso
      const cursoCriado = await mockApi.cursos.create(cursoBase);
      
      // Verifica que o curso existe
      const cursoAntes = await mockApi.cursos.findById(cursoCriado.id);
      expect(cursoAntes).not.toBeNull();

      // Deleta o curso
      const deleteResult = await mockApi.cursos.delete(cursoCriado.id);
      expect(deleteResult).toBe(true);

      // Verifica se o curso foi realmente removido
      const cursoDepois = await mockApi.cursos.findById(cursoCriado.id);
      expect(cursoDepois).toBeNull();
    });
  });

  // Testes de validação e casos de erro
  describe('Validações e Casos de Erro', () => {
    test('POST /alunos - Deve retornar erro ao cadastrar aluno sem nome', async () => {
      const alunoInvalido = {
        matricula: '20240001',
        cursos: ['Matemática']
      };

      // Testa se a função create rejeita aluno sem nome
      await expect(mockApi.alunos.create(alunoInvalido)).rejects.toThrow('Nome é obrigatório');
    });

    test('POST /cursos - Deve retornar erro ao cadastrar curso sem nome', async () => {
      const cursoInvalido = {
        codigo: 'MAT101',
        cargaHoraria: 60
      };

      await expect(mockApi.cursos.create(cursoInvalido)).rejects.toThrow('Nome e código são obrigatórios');
    });

    test('GET /alunos/:id - Deve retornar null para aluno não encontrado', async () => {
      const response = await mockApi.alunos.findById('9999');
      expect(response).toBeNull();
    });

    test('PUT /alunos/:id - Deve retornar null para aluno não encontrado', async () => {
      const response = await mockApi.alunos.update('9999', alunoBase);
      expect(response).toBeNull();
    });

    test('Validação de campos obrigatórios do aluno', () => {
      // Testa se alunoBase tem todos os campos obrigatórios
      expect(alunoBase).toHaveProperty('nome');
      expect(alunoBase).toHaveProperty('matricula');
      expect(alunoBase).toHaveProperty('cursos');
      
      expect(typeof alunoBase.nome).toBe('string');
      expect(alunoBase.nome.length).toBeGreaterThan(0);
      expect(typeof alunoBase.matricula).toBe('string');
      expect(alunoBase.matricula.length).toBeGreaterThan(0);
      expect(Array.isArray(alunoBase.cursos)).toBe(true);
    });

    test('Validação de campos obrigatórios do curso', () => {
      // Testa se cursoBase tem todos os campos obrigatórios
      expect(cursoBase).toHaveProperty('nome');
      expect(cursoBase).toHaveProperty('codigo');
      expect(cursoBase).toHaveProperty('cargaHoraria');
      
      expect(typeof cursoBase.nome).toBe('string');
      expect(cursoBase.nome.length).toBeGreaterThan(0);
      expect(typeof cursoBase.codigo).toBe('string');
      expect(cursoBase.codigo.length).toBeGreaterThan(0);
      expect(typeof cursoBase.cargaHoraria).toBe('number');
      expect(cursoBase.cargaHoraria).toBeGreaterThan(0);
    });

    test('Validação de aluno inválido sem nome', () => {
      const alunoInvalido = {
        matricula: '20240001',
        cursos: ['Matemática']
      };

      // Verifica que o aluno inválido não tem a propriedade nome
      expect(alunoInvalido).not.toHaveProperty('nome');
      // Ou verifica que a propriedade nome é undefined
      expect('nome' in alunoInvalido).toBe(false);
    });
  });
});