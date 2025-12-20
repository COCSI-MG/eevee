import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import fs from "fs";
import os from "os";
import path from "path";
import { main } from "./server";

jest.setTimeout(20000);

const PROTO_SRC = `
syntax = "proto3";
package movie;
import "google/protobuf/empty.proto";

message Movie {
  int32 id = 1;
  string title = 2;
  int32 release_year = 3;
  int32 genre_id = 4;
  string genre_name = 5;
}

message Actor {
  int32 id = 1;
  string name = 2;
  string birth_date = 3;
}

message Genre {
  int32 id = 1;
  string name = 2;
}

message CreateMovieRequest {
  string title = 1;
  int32 release_year = 2;
  int32 genre_id = 3;
}

message UpdateMovieRequest {
  int32 id = 1;
  string title = 2;
  int32 release_year = 3;
  int32 genre_id = 4;
}

message GetMovieRequest {
  int32 id = 1;
}

message DeleteMovieRequest {
  int32 id = 1;
}

message CreateActorRequest {
  string name = 1;
  string birth_date = 2;
}

message UpdateActorRequest {
  int32 id = 1;
  string name = 2;
  string birth_date = 3;
}

message GetActorRequest {
  int32 id = 1;
}

message DeleteActorRequest {
  int32 id = 1;
}

message CreateGenreRequest {
  string name = 1;
}

message UpdateGenreRequest {
  int32 id = 1;
  string name = 2;
}

message GetGenreRequest {
  int32 id = 1;
}

message DeleteGenreRequest {
  int32 id = 1;
}

message ListMoviesResponse {
  repeated Movie movies = 1;
}

message ListActorsResponse {
  repeated Actor actors = 1;
}

message ListGenresResponse {
  repeated Genre genres = 1;
}

service MovieService {
  rpc ListMovies(google.protobuf.Empty) returns (ListMoviesResponse);
  rpc GetMovie(GetMovieRequest) returns (Movie);
  rpc CreateMovie(CreateMovieRequest) returns (Movie);
  rpc UpdateMovie(UpdateMovieRequest) returns (Movie);
  rpc DeleteMovie(DeleteMovieRequest) returns (google.protobuf.Empty);
}

service ActorService {
  rpc ListActors(google.protobuf.Empty) returns (ListActorsResponse);
  rpc GetActor(GetActorRequest) returns (Actor);
  rpc CreateActor(CreateActorRequest) returns (Actor);
  rpc UpdateActor(UpdateActorRequest) returns (Actor);
  rpc DeleteActor(DeleteActorRequest) returns (google.protobuf.Empty);
}

service GenreService {
  rpc ListGenres(google.protobuf.Empty) returns (ListGenresResponse);
  rpc GetGenre(GetGenreRequest) returns (Genre);
  rpc CreateGenre(CreateGenreRequest) returns (Genre);
  rpc UpdateGenre(UpdateGenreRequest) returns (Genre);
  rpc DeleteGenre(DeleteGenreRequest) returns (google.protobuf.Empty);
}
`;

function createClients(address: string) {
  const protoPath = path.join(os.tmpdir(), `movie-test-${Date.now()}.proto`);
  fs.writeFileSync(protoPath, PROTO_SRC, "utf8");

  const def = protoLoader.loadSync(protoPath, {});

  const movie = (grpc.loadPackageDefinition(def) as any).movie;
  
  return {
    movieClient: new movie.MovieService(address, grpc.credentials.createInsecure()),
    actorClient: new movie.ActorService(address, grpc.credentials.createInsecure()),
    genreClient: new movie.GenreService(address, grpc.credentials.createInsecure()),
  };
}

describe("MovieService - Phase 1 (expected failure when wrong port)", () => {
  let server: grpc.Server | undefined;
  let clients: any | undefined;

  const WRONG_PORT = "50053";

  beforeAll(() => {
    server = main();
    clients = createClients(`localhost:${WRONG_PORT}`);
  });

  afterAll((done) => {
    if (clients) {
      clients.movieClient.close();
      clients.actorClient.close();
      clients.genreClient.close();
    }
    if (server) server.tryShutdown(() => done());
    else done();
  });

  it("should NOT connect when server is not on process.env.PORT", (done) => {
    clients.movieClient.ListMovies({}, (err: any, res: any) => {
      expect(err).toBeTruthy();
      const okCodes = [grpc.status.UNAVAILABLE, grpc.status.DEADLINE_EXCEEDED];
      if (typeof err?.code === "number") {
        expect(okCodes).toContain(err.code);
      }
      expect(res).toBeUndefined();
      done();
    });
  });
});

describe("Protocol Validation - Must use gRPC", () => {
  let server: grpc.Server | undefined;
  const TEST_PORT = "50054";

  beforeAll((done) => {
    process.env.PORT = TEST_PORT;
    server = main();
    setTimeout(done, 1000);
  });

  afterAll((done) => {
    if (server) server.tryShutdown(() => done());
    else done();
  });

  it("should use Content-Type: application/grpc (not application/json)", (done) => {
    const http2 = require("http2");
    
    const client = http2.connect(`http://localhost:${TEST_PORT}`);
    
    const req = client.request({
      ":method": "POST",
      ":path": "/movie.MovieService/ListMovies",
      "content-type": "application/grpc",
      "te": "trailers"
    });

    let receivedContentType = "";
    
    req.on("response", (headers: any) => {
      receivedContentType = headers["content-type"] || "";
      
      // gRPC always uses application/grpc, never application/json
      expect(receivedContentType).toMatch(/^application\/grpc/);
      expect(receivedContentType).not.toBe("application/json");
    });

    req.on("end", () => {
      client.close();
      done();
    });

    req.end();
  });

  it("should use POST method only (gRPC never uses GET, PUT, DELETE)", (done) => {
    const http2 = require("http2");
    
    const client = http2.connect(`http://localhost:${TEST_PORT}`);
    
    const req = client.request({
      ":method": "GET",
      ":path": "/movie.MovieService/ListMovies",
      "content-type": "application/grpc",
      "te": "trailers"
    });

    let grpcStatus: string | undefined;
    
    req.on("response", (headers: any) => {
      grpcStatus = headers["grpc-status"];
      
      // gRPC must return error for GET method
      // grpc-status should be different from "0" (OK)
      if (grpcStatus !== undefined) {
        expect(grpcStatus).not.toBe("0");
      }
    });

    req.on("end", () => {
      // Verify that GET did not work correctly
      // gRPC only accepts POST
      if (grpcStatus !== undefined) {
        expect(grpcStatus).not.toBe("0");
      }
      client.close();
      done();
    });

    req.on("error", () => {
      // Error is also expected - GET does not work
      client.close();
      done();
    });

    req.end();
  });

  it("should use gRPC path format: /package.Service/Method", (done) => {
    const http2 = require("http2");
    
    const client = http2.connect(`http://localhost:${TEST_PORT}`);
    
    // Valid gRPC path
    const validGrpcPath = "/movie.MovieService/ListMovies";
    
    const req = client.request({
      ":method": "POST",
      ":path": validGrpcPath,
      "content-type": "application/grpc",
      "te": "trailers"
    });

    let grpcStatusValid: string | undefined;
    
    req.on("response", (headers: any) => {
      grpcStatusValid = headers["grpc-status"];
    });

    req.on("end", () => {
      // gRPC path format should work
      // Verify that path follows /package.Service/Method pattern
      expect(validGrpcPath).toMatch(/^\/\w+\.\w+\/\w+$/);
      expect(validGrpcPath).not.toMatch(/^\/api\//);
      expect(validGrpcPath).not.toMatch(/^\/movies$/);
      
      // Now test REST path - should fail
      const req2 = client.request({
        ":method": "POST",
        ":path": "/api/movies", // REST path
        "content-type": "application/grpc",
        "te": "trailers"
      });

      let grpcStatusInvalid: string | undefined;
      
      req2.on("response", (headers: any) => {
        grpcStatusInvalid = headers["grpc-status"];
      });

      req2.on("end", () => {
        // REST path should not work (grpc-status != 0 or undefined)
        if (grpcStatusInvalid !== undefined) {
          expect(grpcStatusInvalid).not.toBe("0");
        }
        
        client.close();
        done();
      });

      req2.end();
    });

    req.end();
  });

  it("should use gRPC status codes (0-16, not HTTP 200-500)", (done) => {
    const protoPath = path.join(os.tmpdir(), `movie-protocol-test-2-${Date.now()}.proto`);
    fs.writeFileSync(protoPath, PROTO_SRC, "utf8");

    const def = protoLoader.loadSync(protoPath, {});
    const movie = (grpc.loadPackageDefinition(def) as any).movie;
    const client = new movie.MovieService(
      `localhost:${TEST_PORT}`,
      grpc.credentials.createInsecure()
    );

    client.GetMovie({ id: 999 }, (err: any, res: any) => {
      expect(err).toBeTruthy();
      expect(err).toHaveProperty("code");
      
      // gRPC status codes range from 0-16
      expect(err.code).toBeGreaterThanOrEqual(0);
      expect(err.code).toBeLessThanOrEqual(16);
      
      // Specifically, NOT_FOUND is 5 in gRPC (not 404 in HTTP)
      expect(err.code).toBe(5);
      expect(err.code).not.toBe(404);
      
      // gRPC error has 'details' property (not 'message' like REST)
      expect(err).toHaveProperty("details");
      expect(typeof err.details).toBe("string");
      
      client.close();
      done();
    });
  });

  it("should verify server is instance of gRPC Server", () => {
    // Server must be grpc.Server, not Express/Fastify/HTTP
    expect(server).toBeInstanceOf(grpc.Server);
    expect(typeof server?.tryShutdown).toBe("function");
    expect(typeof server?.forceShutdown).toBe("function");
    expect(typeof server?.bindAsync).toBe("function");
  });
});

describe("MovieService - Phase 2 (success when using process.env.PORT)", () => {
  let server: grpc.Server | undefined;
  let clients: any | undefined;

  const TEST_PORT = "50053";

  beforeAll((done) => {
    process.env.PORT = TEST_PORT;
    server = main();
    
    setTimeout(() => {
      clients = createClients(`localhost:${TEST_PORT}`);

      const deadline = Date.now() + 10000;
      clients.movieClient.waitForReady(deadline, (err: any) => {
        if (err) return done(err);
        expect(err).toBeFalsy();
        done();
      });
    }, 1000);
  });

  afterAll((done) => {
    if (clients) {
      clients.movieClient.close();
      clients.actorClient.close();
      clients.genreClient.close();
    }
    if (server) server.tryShutdown(() => done());
    else done();
  });

  describe("GenreService - Complete Flow", () => {
    let createdGenreId: number;

    it("validates required name on create", (done) => {
      clients.genreClient.CreateGenre({ name: "" }, (err: any, res: any) => {
        expect(err).toBeTruthy();
        expect(err.code).toBe(grpc.status.INVALID_ARGUMENT);
        expect(err.message).toContain("Name is required");
        done();
      });
    });

    it("creates new genre", (done) => {
      clients.genreClient.CreateGenre({ name: "Action" }, (err: any, res: any) => {
        expect(err).toBeNull();
        expect(res).toBeDefined();
        expect(res.id).toBe(1);
        expect(res.name).toBe("Action");
        createdGenreId = res.id;
        done();
      });
    });

    it("lists genres after creation", (done) => {
      clients.genreClient.ListGenres({}, (err: any, res: any) => {
        expect(err).toBeNull();
        expect(res).toBeDefined();
        const genres = res.genres || [];
        expect(Array.isArray(genres)).toBe(true);
        expect(genres.length).toBe(1);
        expect(genres[0].name).toBe("Action");
        done();
      });
    });

    it("gets genre by ID", (done) => {
      clients.genreClient.GetGenre({ id: createdGenreId }, (err: any, res: any) => {
        expect(err).toBeNull();
        expect(res).toBeDefined();
        expect(res.id).toBe(createdGenreId);
        expect(res.name).toBe("Action");
        done();
      });
    });

    it("updates genre (partial update)", (done) => {
      clients.genreClient.UpdateGenre({ id: createdGenreId, name: "Sci-Fi" }, (err: any, res: any) => {
        expect(err).toBeNull();
        expect(res).toBeDefined();
        expect(res.id).toBe(createdGenreId);
        expect(res.name).toBe("Sci-Fi");
        done();
      });
    });

    it("lists genres after update", (done) => {
      clients.genreClient.ListGenres({}, (err: any, res: any) => {
        expect(err).toBeNull();
        expect(res).toBeDefined();
        const genres = res.genres || [];
        expect(Array.isArray(genres)).toBe(true);
        expect(genres.length).toBe(1);
        expect(genres[0].name).toBe("Sci-Fi");
        done();
      });
    });

    it("deletes genre", (done) => {
      clients.genreClient.DeleteGenre({ id: createdGenreId }, (err: any, res: any) => {
        expect(err).toBeNull();
        done();
      });
    });

    it("validates genre not found after deletion", (done) => {
      clients.genreClient.GetGenre({ id: createdGenreId }, (err: any, res: any) => {
        expect(err).toBeTruthy();
        expect(err.code).toBe(grpc.status.NOT_FOUND);
        done();
      });
    });
  });

  describe("ActorService - Complete Flow", () => {
    let createdActorId: number;

    it("validates required name on create", (done) => {
      clients.actorClient.CreateActor({ name: "", birthDate: "1990-01-01" }, (err: any, res: any) => {
        expect(err).toBeTruthy();
        expect(err.code).toBe(grpc.status.INVALID_ARGUMENT);
        expect(err.message).toContain("Name is required");
        done();
      });
    });

    it("validates required birth date on create", (done) => {
      clients.actorClient.CreateActor({ name: "John Doe", birthDate: "" }, (err: any, res: any) => {
        expect(err).toBeTruthy();
        expect(err.code).toBe(grpc.status.INVALID_ARGUMENT);
        expect(err.message).toContain("Birth date is required");
        done();
      });
    });

    it("validates birth date format on create", (done) => {
      clients.actorClient.CreateActor({ name: "John Doe", birthDate: "01/01/1990" }, (err: any, res: any) => {
        expect(err).toBeTruthy();
        expect(err.code).toBe(grpc.status.INVALID_ARGUMENT);
        expect(err.message).toContain("YYYY-MM-DD");
        done();
      });
    });

    it("creates new actor", (done) => {
      clients.actorClient.CreateActor({ name: "John Doe", birthDate: "1990-05-15" }, (err: any, res: any) => {
        expect(err).toBeNull();
        expect(res).toBeDefined();
        expect(res.id).toBe(1);
        expect(res.name).toBe("John Doe");
        expect(res.birthDate).toBe("1990-05-15");
        createdActorId = res.id;
        done();
      });
    });

    it("lists actors after creation", (done) => {
      clients.actorClient.ListActors({}, (err: any, res: any) => {
        expect(err).toBeNull();
        expect(res).toBeDefined();
        const actors = res.actors || [];
        expect(Array.isArray(actors)).toBe(true);
        expect(actors.length).toBe(1);
        expect(actors[0].name).toBe("John Doe");
        done();
      });
    });

    it("gets actor by ID", (done) => {
      clients.actorClient.GetActor({ id: createdActorId }, (err: any, res: any) => {
        expect(err).toBeNull();
        expect(res).toBeDefined();
        expect(res.id).toBe(createdActorId);
        expect(res.name).toBe("John Doe");
        expect(res.birthDate).toBe("1990-05-15");
        done();
      });
    });

    it("updates actor name only (partial update)", (done) => {
      clients.actorClient.UpdateActor({ id: createdActorId, name: "Jane Doe", birthDate: "" }, (err: any, res: any) => {
        expect(err).toBeNull();
        expect(res).toBeDefined();
        expect(res.id).toBe(createdActorId);
        expect(res.name).toBe("Jane Doe");
        expect(res.birthDate).toBe("1990-05-15");
        done();
      });
    });

    it("updates actor birth date only (partial update)", (done) => {
      clients.actorClient.UpdateActor({ id: createdActorId, name: "", birthDate: "1985-03-20" }, (err: any, res: any) => {
        expect(err).toBeNull();
        expect(res).toBeDefined();
        expect(res.id).toBe(createdActorId);
        expect(res.name).toBe("Jane Doe");
        expect(res.birthDate).toBe("1985-03-20");
        done();
      });
    });

    it("validates birth date format on update", (done) => {
      clients.actorClient.UpdateActor({ id: createdActorId, name: "", birthDate: "invalid-date" }, (err: any, res: any) => {
        expect(err).toBeTruthy();
        expect(err.code).toBe(grpc.status.INVALID_ARGUMENT);
        expect(err.message).toContain("YYYY-MM-DD");
        done();
      });
    });

    it("lists actors after update", (done) => {
      clients.actorClient.ListActors({}, (err: any, res: any) => {
        expect(err).toBeNull();
        expect(res).toBeDefined();
        const actors = res.actors || [];
        expect(Array.isArray(actors)).toBe(true);
        expect(actors.length).toBe(1);
        expect(actors[0].name).toBe("Jane Doe");
        expect(actors[0].birthDate).toBe("1985-03-20");
        done();
      });
    });

    it("deletes actor", (done) => {
      clients.actorClient.DeleteActor({ id: createdActorId }, (err: any, res: any) => {
        expect(err).toBeNull();
        done();
      });
    });

    it("validates actor not found after deletion", (done) => {
      clients.actorClient.GetActor({ id: createdActorId }, (err: any, res: any) => {
        expect(err).toBeTruthy();
        expect(err.code).toBe(grpc.status.NOT_FOUND);
        done();
      });
    });
  });

  describe("MovieService - Complete Flow", () => {
    let createdGenreId: number;
    let createdMovieId: number;

    beforeAll((done) => {
      clients.genreClient.CreateGenre({ name: "Drama" }, (err: any, res: any) => {
        expect(err).toBeNull();
        createdGenreId = res.id;
        done();
      });
    });

    it("validates required title", (done) => {
      clients.movieClient.CreateMovie(
        { title: "", releaseYear: 2023, genreId: createdGenreId },
        (err: any, res: any) => {
          expect(err).toBeTruthy();
          expect(err.code).toBe(grpc.status.INVALID_ARGUMENT);
          expect(err.message).toContain("Title is required");
          done();
        }
      );
    });

    it("validates release year (too old)", (done) => {
      clients.movieClient.CreateMovie(
        { title: "Test Movie", releaseYear: 1800, genreId: createdGenreId },
        (err: any, res: any) => {
          expect(err).toBeTruthy();
          expect(err.code).toBe(grpc.status.INVALID_ARGUMENT);
          expect(err.message).toContain("Invalid release year");
          done();
        }
      );
    });

    it("validates release year (too future)", (done) => {
      const futureYear = new Date().getFullYear() + 10;
      clients.movieClient.CreateMovie(
        { title: "Test Movie", releaseYear: futureYear, genreId: createdGenreId },
        (err: any, res: any) => {
          expect(err).toBeTruthy();
          expect(err.code).toBe(grpc.status.INVALID_ARGUMENT);
          expect(err.message).toContain("Invalid release year");
          done();
        }
      );
    });

    it("validates genre exists", (done) => {
      clients.movieClient.CreateMovie(
        { title: "Test", releaseYear: 2023, genreId: 999 },
        (err: any, res: any) => {
          expect(err).toBeTruthy();
          expect(err.code).toBe(grpc.status.NOT_FOUND);
          expect(err.message).toContain("Genre not found");
          done();
        }
      );
    });

    it("creates new movie", (done) => {
      clients.movieClient.CreateMovie(
        { title: "The Shawshank Redemption", releaseYear: 1994, genreId: createdGenreId },
        (err: any, res: any) => {
          expect(err).toBeNull();
          expect(res).toBeDefined();
          expect(res.id).toBe(1);
          expect(res.title).toBe("The Shawshank Redemption");
          expect(res.releaseYear).toBe(1994);
          expect(res.genreId).toBe(createdGenreId);
          expect(res.genreName).toBe("Drama");
          createdMovieId = res.id;
          done();
        }
      );
    });

    it("lists movies after creation", (done) => {
      clients.movieClient.ListMovies({}, (err: any, res: any) => {
        expect(err).toBeNull();
        expect(res).toBeDefined();
        const movies = res.movies || [];
        expect(Array.isArray(movies)).toBe(true);
        expect(movies.length).toBe(1);
        expect(movies[0].title).toBe("The Shawshank Redemption");
        done();
      });
    });

    it("gets movie by ID", (done) => {
      clients.movieClient.GetMovie({ id: createdMovieId }, (err: any, res: any) => {
        expect(err).toBeNull();
        expect(res).toBeDefined();
        expect(res.id).toBe(createdMovieId);
        expect(res.title).toBe("The Shawshank Redemption");
        expect(res.releaseYear).toBe(1994);
        done();
      });
    });

    it("updates movie title only (partial update)", (done) => {
      clients.movieClient.UpdateMovie(
        { id: createdMovieId, title: "Shawshank", releaseYear: 0, genreId: 0 },
        (err: any, res: any) => {
          expect(err).toBeNull();
          expect(res).toBeDefined();
          expect(res.id).toBe(createdMovieId);
          expect(res.title).toBe("Shawshank");
          expect(res.releaseYear).toBe(1994);
          expect(res.genreId).toBe(createdGenreId);
          done();
        }
      );
    });

    it("updates movie year only (partial update)", (done) => {
      clients.movieClient.UpdateMovie(
        { id: createdMovieId, title: "", releaseYear: 1995, genreId: 0 },
        (err: any, res: any) => {
          expect(err).toBeNull();
          expect(res).toBeDefined();
          expect(res.id).toBe(createdMovieId);
          expect(res.title).toBe("Shawshank");
          expect(res.releaseYear).toBe(1995);
          done();
        }
      );
    });

    it("validates release year on update", (done) => {
      clients.movieClient.UpdateMovie(
        { id: createdMovieId, title: "", releaseYear: 1500, genreId: 0 },
        (err: any, res: any) => {
          expect(err).toBeTruthy();
          expect(err.code).toBe(grpc.status.INVALID_ARGUMENT);
          expect(err.message).toContain("Invalid release year");
          done();
        }
      );
    });

    it("lists movies after update", (done) => {
      clients.movieClient.ListMovies({}, (err: any, res: any) => {
        expect(err).toBeNull();
        expect(res).toBeDefined();
        const movies = res.movies || [];
        expect(Array.isArray(movies)).toBe(true);
        expect(movies.length).toBe(1);
        expect(movies[0].title).toBe("Shawshank");
        expect(movies[0].releaseYear).toBe(1995);
        done();
      });
    });

    it("deletes movie", (done) => {
      clients.movieClient.DeleteMovie({ id: createdMovieId }, (err: any, res: any) => {
        expect(err).toBeNull();
        done();
      });
    });

    it("validates movie not found after deletion", (done) => {
      clients.movieClient.GetMovie({ id: createdMovieId }, (err: any, res: any) => {
        expect(err).toBeTruthy();
        expect(err.code).toBe(grpc.status.NOT_FOUND);
        done();
      });
    });
  });
});
