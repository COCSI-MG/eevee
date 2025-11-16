const fs = require("fs");
const path = require("path");

describe("Arquitetura em Camadas - Validação da Estrutura (Root)", () => {
  const basePath = path.join(__dirname, "../src");

  describe("Estrutura de Arquivos Obrigatória", () => {
    test("Deve existir o arquivo db.js", () => {
      const dbPath = path.join(basePath, "db.js");
      expect(fs.existsSync(dbPath)).toBe(true);
    });

    test("Deve existir todos os arquivos de alunos", () => {
      expect(fs.existsSync(path.join(basePath, "alunoController.js"))).toBe(
        true
      );
      expect(fs.existsSync(path.join(basePath, "alunoService.js"))).toBe(true);
      expect(fs.existsSync(path.join(basePath, "alunoRepository.js"))).toBe(
        true
      );
    });

    test("Deve existir todos os arquivos de cursos", () => {
      expect(fs.existsSync(path.join(basePath, "cursoController.js"))).toBe(
        true
      );
      expect(fs.existsSync(path.join(basePath, "cursoService.js"))).toBe(true);
      expect(fs.existsSync(path.join(basePath, "cursoRepository.js"))).toBe(
        true
      );
    });
  });

  describe("Validação das Exportações dos Módulos", () => {
    let db,
      alunoController,
      alunoService,
      alunoRepository,
      cursoController,
      cursoService,
      cursoRepository;

    beforeAll(() => {
      try {
        // Carrega todos os módulos para verificar se exportam corretamente
        db = require(path.join(basePath, "db.js"));
        alunoController = require(path.join(basePath, "alunoController.js"));
        alunoService = require(path.join(basePath, "alunoService.js"));
        alunoRepository = require(path.join(basePath, "alunoRepository.js"));
        cursoController = require(path.join(basePath, "cursoController.js"));
        cursoService = require(path.join(basePath, "cursoService.js"));
        cursoRepository = require(path.join(basePath, "cursoRepository.js"));
      } catch (error) {
        // Se algum falhar, o teste vai capturar
      }
    });

    test("db.js deve exportar uma instância com métodos de banco", () => {
      expect(db).toBeDefined();
      expect(typeof db).toBe("object");

      // Verifica métodos básicos esperados no db
      expect(db.getAlunos).toBeDefined();
      expect(db.addAluno).toBeDefined();
      expect(db.getCursos).toBeDefined();
      expect(db.addCurso).toBeDefined();
    });

    test("Aluno Controller deve exportar métodos de controle", () => {
      expect(alunoController).toBeDefined();

      // Verifica se exporta os métodos principais do controller
      const expectedMethods = [
        "listarAlunos",
        "buscarAluno",
        "cadastrarAluno",
        "editarAluno",
        "editarAlunoParcial",
        "deletarAluno",
      ];

      expectedMethods.forEach((method) => {
        expect(alunoController[method]).toBeDefined();
        expect(typeof alunoController[method]).toBe("function");
      });
    });

    test("Aluno Service deve exportar métodos de negócio", () => {
      expect(alunoService).toBeDefined();

      const expectedMethods = [
        "listarAlunos",
        "buscarAlunoPorId",
        "cadastrarAluno",
        "editarAluno",
        "editarAlunoParcial",
        "deletarAluno",
      ];

      expectedMethods.forEach((method) => {
        expect(alunoService[method]).toBeDefined();
        expect(typeof alunoService[method]).toBe("function");
      });
    });

    test("Aluno Repository deve exportar métodos de acesso a dados", () => {
      expect(alunoRepository).toBeDefined();

      const expectedMethods = [
        "findAll",
        "findById",
        "create",
        "update",
        "partialUpdate",
        "delete",
      ];

      expectedMethods.forEach((method) => {
        expect(alunoRepository[method]).toBeDefined();
        expect(typeof alunoRepository[method]).toBe("function");
      });
    });

    test("Curso Controller deve exportar métodos de controle", () => {
      expect(cursoController).toBeDefined();

      const expectedMethods = [
        "listarCursos",
        "buscarCurso",
        "cadastrarCurso",
        "editarCurso",
        "editarCursoParcial",
        "deletarCurso",
      ];

      expectedMethods.forEach((method) => {
        expect(cursoController[method]).toBeDefined();
        expect(typeof cursoController[method]).toBe("function");
      });
    });

    test("Curso Service deve exportar métodos de negócio", () => {
      expect(cursoService).toBeDefined();

      const expectedMethods = [
        "listarCursos",
        "buscarCursoPorId",
        "cadastrarCurso",
        "editarCurso",
        "editarCursoParcial",
        "deletarCurso",
      ];

      expectedMethods.forEach((method) => {
        expect(cursoService[method]).toBeDefined();
        expect(typeof cursoService[method]).toBe("function");
      });
    });

    test("Curso Repository deve exportar métodos de acesso a dados", () => {
      expect(cursoRepository).toBeDefined();

      const expectedMethods = [
        "findAll",
        "findById",
        "create",
        "update",
        "partialUpdate",
        "delete",
      ];

      expectedMethods.forEach((method) => {
        expect(cursoRepository[method]).toBeDefined();
        expect(typeof cursoRepository[method]).toBe("function");
      });
    });
  });

  describe("Validação das Responsabilidades de Cada Camada", () => {
    test("Repository deve ser a única camada que importa o db", () => {
      // Lê o conteúdo dos arquivos para verificar imports
      const alunoRepositoryContent = fs.readFileSync(
        path.join(basePath, "alunoRepository.js"),
        "utf8"
      );
      const alunoServiceContent = fs.readFileSync(
        path.join(basePath, "alunoService.js"),
        "utf8"
      );
      const alunoControllerContent = fs.readFileSync(
        path.join(basePath, "alunoController.js"),
        "utf8"
      );

      // Repository DEVE importar db
      expect(alunoRepositoryContent).toMatch(/require.*db/);

      // Service NÃO deve importar db diretamente
      expect(alunoServiceContent).not.toMatch(/require.*db/);
      // Service DEVE importar repository
      expect(alunoServiceContent).toMatch(/require.*alunoRepository/);

      // Controller NÃO deve importar db ou repository diretamente
      expect(alunoControllerContent).not.toMatch(/require.*db/);
      expect(alunoControllerContent).not.toMatch(/require.*alunoRepository/);
      // Controller DEVE importar service
      expect(alunoControllerContent).toMatch(/require.*alunoService/);
    });

    test("Service deve importar Repository, não Controller ou DB", () => {
      const alunoServiceContent = fs.readFileSync(
        path.join(basePath, "alunoService.js"),
        "utf8"
      );

      expect(alunoServiceContent).toMatch(/require.*alunoRepository/);
      expect(alunoServiceContent).not.toMatch(/require.*alunoController/);
      expect(alunoServiceContent).not.toMatch(/require.*db/);
    });

    test("Controller deve importar Service, não Repository ou DB", () => {
      const alunoControllerContent = fs.readFileSync(
        path.join(basePath, "alunoController.js"),
        "utf8"
      );

      expect(alunoControllerContent).toMatch(/require.*alunoService/);
      expect(alunoControllerContent).not.toMatch(/require.*alunoRepository/);
      expect(alunoControllerContent).not.toMatch(/require.*db/);
    });

    test("Mesma validação para cursos", () => {
      const cursoRepositoryContent = fs.readFileSync(
        path.join(basePath, "cursoRepository.js"),
        "utf8"
      );
      const cursoServiceContent = fs.readFileSync(
        path.join(basePath, "cursoService.js"),
        "utf8"
      );
      const cursoControllerContent = fs.readFileSync(
        path.join(basePath, "cursoController.js"),
        "utf8"
      );

      // Repository DEVE importar db
      expect(cursoRepositoryContent).toMatch(/require.*db/);

      // Service NÃO deve importar db diretamente
      expect(cursoServiceContent).not.toMatch(/require.*db/);
      // Service DEVE importar repository
      expect(cursoServiceContent).toMatch(/require.*cursoRepository/);

      // Controller NÃO deve importar db ou repository diretamente
      expect(cursoControllerContent).not.toMatch(/require.*db/);
      expect(cursoControllerContent).not.toMatch(/require.*cursoRepository/);
      // Controller DEVE importar service
      expect(cursoControllerContent).toMatch(/require.*cursoService/);
    });
  });

  describe("Validação da Estrutura de Arquivos na Root", () => {
    test("Deve existir exatamente 8 arquivos principais (db, index e 6 arquivos de camadas)", () => {
      const srcFiles = fs.readdirSync(basePath);
      const expectedFiles = [
        "db.js",
        "index.js",
        "alunoController.js",
        "alunoService.js",
        "alunoRepository.js",
        "cursoController.js",
        "cursoService.js",
        "cursoRepository.js",
      ];

      // Verifica se todos os arquivos esperados existem
      expectedFiles.forEach((file) => {
        expect(srcFiles).toContain(file);
      });

      // Verifica se não há arquivos extras além dos permitidos
      const allowedFiles = [...expectedFiles];
      const unexpectedFiles = srcFiles.filter(
        (file) => !allowedFiles.includes(file)
      );

      expect(unexpectedFiles.length).toBe(0);
    });

    test("Não deve existir pastas de alunos e cursos", () => {
      const srcFiles = fs.readdirSync(basePath);

      expect(srcFiles).not.toContain("alunos");
      expect(srcFiles).not.toContain("cursos");
    });
  });
});
