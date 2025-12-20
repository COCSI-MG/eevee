import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import fs from "fs";
import os from "os";
import path from "path";

interface Movie {
  id: number;
  title: string;
  release_year: number;
  genre_id: number;
  genre_name: string;
}

interface Genre {
  id: number;
  name: string;
}

interface Actor {
  id: number;
  name: string;
  birth_date: string;
}

interface MovieActor {
  movie_id: number;
  actor_id: number;
}

export function main() {
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

    message ListMoviesResponse {
      repeated Movie movies = 1;
    }

    message AddActorToMovieRequest {
      int32 movie_id = 1;
      int32 actor_id = 2;
    }

    message ListMovieActorsRequest {
      int32 movie_id = 1;
    }

    message Actor {
      int32 id = 1;
      string name = 2;
      string birth_date = 3;
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

    message ListActorsResponse {
      repeated Actor actors = 1;
    }

    message Genre {
      int32 id = 1;
      string name = 2;
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

    message ListGenresResponse {
      repeated Genre genres = 1;
    }

    service MovieService {
      rpc ListMovies(google.protobuf.Empty) returns (ListMoviesResponse);
      rpc GetMovie(GetMovieRequest) returns (Movie);
      rpc CreateMovie(CreateMovieRequest) returns (Movie);
      rpc UpdateMovie(UpdateMovieRequest) returns (Movie);
      rpc DeleteMovie(DeleteMovieRequest) returns (google.protobuf.Empty);
      rpc ListMovieActors(ListMovieActorsRequest) returns (ListActorsResponse);
      rpc AddActorToMovie(AddActorToMovieRequest) returns (google.protobuf.Empty);
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

  const protoPath = path.join(os.tmpdir(), `movie-${Date.now()}.proto`);
  fs.writeFileSync(protoPath, PROTO_SRC, "utf8");

  const packageDef = protoLoader.loadSync(protoPath, {});
  const grpcObj = grpc.loadPackageDefinition(packageDef) as any;
  const moviePkg = grpcObj.movie;

  const movies: Movie[] = [];
  const genres: Genre[] = [];
  const actors: Actor[] = [];
  const movieActors: MovieActor[] = [];

  let nextMovieId = 1;
  let nextActorId = 1;
  let nextGenreId = 1;

  const movieToGrpc = (movie: any) => ({
    id: movie.id,
    title: movie.title,
    releaseYear: movie.release_year,
    genreId: movie.genre_id,
    genreName: movie.genre_name
  });

  const actorToGrpc = (actor: any) => ({
    id: actor.id,
    name: actor.name,
    birthDate: actor.birth_date
  });

  const genreToGrpc = (genre: any) => ({
    id: genre.id,
    name: genre.name
  });

  const server = new grpc.Server();

  server.addService(moviePkg.MovieService.service, {
    ListMovies: (call: any, callback: any) => {
      callback(null, { movies: movies.map(movieToGrpc) });
    },

    GetMovie: (call: any, callback: any) => {
      const { id } = call.request;
      const movie = movies.find(m => m.id === id);
      if (!movie) {
        callback({ code: grpc.status.NOT_FOUND, message: "Movie not found" });
        return;
      }
      callback(null, movieToGrpc(movie));
    },

    CreateMovie: (call: any, callback: any) => {
      const { title, releaseYear, genreId } = call.request;
      const release_year = releaseYear;
      const genre_id = genreId;
      
      if (!title || title.trim().length === 0) {
        callback({ code: grpc.status.INVALID_ARGUMENT, message: "Title is required" });
        return;
      }

      if (release_year < 1888 || release_year > new Date().getFullYear() + 5) {
        callback({ code: grpc.status.INVALID_ARGUMENT, message: "Invalid release year" });
        return;
      }

      const genre = genres.find(g => g.id === genre_id);
      if (!genre) {
        callback({ code: grpc.status.NOT_FOUND, message: "Genre not found" });
        return;
      }

      const newMovie = {
        id: nextMovieId++,
        title,
        release_year,
        genre_id,
        genre_name: genre.name
      };

      movies.push(newMovie);
      callback(null, movieToGrpc(newMovie));
    },

    UpdateMovie: (call: any, callback: any) => {
      const { id, title, releaseYear, genreId } = call.request;
      
      const movieIndex = movies.findIndex(m => m.id === id);
      if (movieIndex === -1) {
        callback({ code: grpc.status.NOT_FOUND, message: "Movie not found" });
        return;
      }

      const currentMovie = movies[movieIndex];
      const updatedTitle = title && title.trim().length > 0 ? title : currentMovie.title;
      let updatedReleaseYear = currentMovie.release_year;
      let updatedGenreId = currentMovie.genre_id;
      let updatedGenreName = currentMovie.genre_name;

      if (releaseYear) {
        if (releaseYear < 1888 || releaseYear > new Date().getFullYear() + 5) {
          callback({ code: grpc.status.INVALID_ARGUMENT, message: "Invalid release year" });
          return;
        }
        updatedReleaseYear = releaseYear;
      }

      if (genreId) {
        const genre = genres.find(g => g.id === genreId);
        if (!genre) {
          callback({ code: grpc.status.NOT_FOUND, message: "Genre not found" });
          return;
        }
        updatedGenreId = genreId;
        updatedGenreName = genre.name;
      }

      movies[movieIndex] = {
        id,
        title: updatedTitle,
        release_year: updatedReleaseYear,
        genre_id: updatedGenreId,
        genre_name: updatedGenreName
      };

      callback(null, movieToGrpc(movies[movieIndex]));
    },

    DeleteMovie: (call: any, callback: any) => {
      const { id } = call.request;
      const movieIndex = movies.findIndex(m => m.id === id);
      
      if (movieIndex === -1) {
        callback({ code: grpc.status.NOT_FOUND, message: "Movie not found" });
        return;
      }

      movies.splice(movieIndex, 1);
      movieActors.forEach((movieActor, index) => {
        if (movieActor.movie_id === id) {
          movieActors.splice(index, 1);
        }
      });
      // for (let i = movieActors.length - 1; i >= 0; i--) {
      //   if (movieActors[i].movie_id === id) {
      //     movieActors.splice(i, 1);
      //   }
      // }

      callback(null, {});
    },

    ListMovieActors: (call: any, callback: any) => {
      const { movieId } = call.request;
      const movie_id = movieId;
      const movie = movies.find(m => m.id === movie_id);
      
      if (!movie) {
        callback({ code: grpc.status.NOT_FOUND, message: "Movie not found" });
        return;
      }

      const actorIds = movieActors
        .filter(ma => ma.movie_id === movie_id)
        .map(ma => ma.actor_id);
      
      const movieActorsList = actors.filter(actor => actorIds.includes(actor.id));
      callback(null, { actors: movieActorsList.map(actorToGrpc) });
    },

    AddActorToMovie: (call: any, callback: any) => {
      const { movieId, actorId } = call.request;

      const movie = movies.find(m => m.id === movieId);
      if (!movie) {
        callback({ code: grpc.status.NOT_FOUND, message: "Movie not found" });
        return;
      }

      const actor = actors.find(a => a.id === actorId);
      if (!actor) {
        callback({ code: grpc.status.NOT_FOUND, message: "Actor not found" });
        return;
      }

      const existingRelation = movieActors.find(
        ma => ma.movie_id === movieId && ma.actor_id === actorId
      );

      if (existingRelation) {
        callback({ code: grpc.status.ALREADY_EXISTS, message: "Actor already associated with movie" });
        return;
      }

      movieActors.push({ movie_id: movieId, actor_id: actorId });
      callback(null, {});
    }
  });

  server.addService(moviePkg.ActorService.service, {
    ListActors: (call: any, callback: any) => {
      callback(null, { actors: actors.map(actorToGrpc) });
    },

    GetActor: (call: any, callback: any) => {
      const { id } = call.request;
      const actor = actors.find(a => a.id === id);
      if (!actor) {
        callback({ code: grpc.status.NOT_FOUND, message: "Actor not found" });
        return;
      }
      callback(null, actorToGrpc(actor));
    },

    CreateActor: (call: any, callback: any) => {
      const { name, birthDate } = call.request;
      const birth_date = birthDate;
      
      if (!name || name.trim().length === 0) {
        callback({ code: grpc.status.INVALID_ARGUMENT, message: "Name is required" });
        return;
      }

      if (!birth_date || birth_date.trim().length === 0) {
        callback({ code: grpc.status.INVALID_ARGUMENT, message: "Birth date is required" });
        return;
      }

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(birth_date)) {
        callback({ code: grpc.status.INVALID_ARGUMENT, message: "Date must be in YYYY-MM-DD format" });
        return;
      }

      const newActor = {
        id: nextActorId++,
        name,
        birth_date
      };

      actors.push(newActor);
      callback(null, actorToGrpc(newActor));
    },

    UpdateActor: (call: any, callback: any) => {
      const { id, name, birthDate } = call.request;
      
      const actorIndex = actors.findIndex(a => a.id === id);
      if (actorIndex === -1) {
        callback({ code: grpc.status.NOT_FOUND, message: "Actor not found" });
        return;
      }

      const currentActor = actors[actorIndex];
      const updatedName = name && name.trim().length > 0 ? name : currentActor.name;
      let updatedBirthDate = currentActor.birth_date;

      if (birthDate && birthDate.trim().length > 0) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(birthDate)) {
          callback({ code: grpc.status.INVALID_ARGUMENT, message: "Date must be in YYYY-MM-DD format" });
          return;
        }
        updatedBirthDate = birthDate;
      }

      actors[actorIndex] = { 
        id, 
        name: updatedName, 
        birth_date: updatedBirthDate 
      };
      callback(null, actorToGrpc(actors[actorIndex]));
    },

    DeleteActor: (call: any, callback: any) => {
      const { id } = call.request;
      const actorIndex = actors.findIndex(a => a.id === id);
      
      if (actorIndex === -1) {
        callback({ code: grpc.status.NOT_FOUND, message: "Actor not found" });
        return;
      }

      actors.splice(actorIndex, 1);
      movieActors.forEach((movieActor, index) => {
        if (movieActor.actor_id === id) {
          movieActors.splice(index, 1);
        }
      });

      callback(null, {});
    }
  });

  server.addService(moviePkg.GenreService.service, {
    ListGenres: (call: any, callback: any) => {
      callback(null, { genres: genres.map(genreToGrpc) });
    },

    GetGenre: (call: any, callback: any) => {
      const { id } = call.request;
      const genre = genres.find(g => g.id === id);
      if (!genre) {
        callback({ code: grpc.status.NOT_FOUND, message: "Genre not found" });
        return;
      }
      callback(null, genreToGrpc(genre));
    },

    CreateGenre: (call: any, callback: any) => {
      const { name } = call.request;
      
      if (!name || name.trim().length === 0) {
        callback({ code: grpc.status.INVALID_ARGUMENT, message: "Name is required" });
        return;
      }

      const newGenre = {
        id: nextGenreId++,
        name
      };

      genres.push(newGenre);
      callback(null, genreToGrpc(newGenre));
    },

    UpdateGenre: (call: any, callback: any) => {
      const { id, name } = call.request;
      
      const genreIndex = genres.findIndex(g => g.id === id);
      if (genreIndex === -1) {
        callback({ code: grpc.status.NOT_FOUND, message: "Genre not found" });
        return;
      }

      const currentGenre = genres[genreIndex];
      const updatedName = name && name.trim().length > 0 ? name : currentGenre.name;

      genres[genreIndex] = { id, name: updatedName };
      callback(null, genreToGrpc(genres[genreIndex]));
    },

    DeleteGenre: (call: any, callback: any) => {
      const { id } = call.request;
      const genreIndex = genres.findIndex(g => g.id === id);
      
      if (genreIndex === -1) {
        callback({ code: grpc.status.NOT_FOUND, message: "Genre not found" });
        return;
      }

      genres.splice(genreIndex, 1);
      callback(null, {});
    }
  });

  const port = String(process.env.PORT || "50052");

  server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(),
    (err, boundPort) => {
      if (err) {
        console.error("bindAsync error:", err);
        return;
      }
      console.log(`MovieService running on port ${boundPort}`);
    }
  );

  return server;
}
