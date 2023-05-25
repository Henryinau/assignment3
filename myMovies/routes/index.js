var express = require('express');
var router = express.Router();
const authorization = require("../middleware/authorization");

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get("/movies/search", function (req, res, next) {
  req.db
    .from("basics")
    .select("originalTitle",
    "year",
    "tconst",
    "imdbRating",
    "rottentomatoesRating",
    "metacriticRating",
    "rated")
    .orderBy("imdbRating", "asc")
    .then((rows) => {
      res.json({ Error: false, Message: "Success", Movie: rows });
    })
    .catch((err) => {
      console.log(err);
      // 根据错误类型返回相应的错误响应
      if (err instanceof Error && err.name === "InvalidQueryParametersError") {
        // 返回400错误响应
        res.status(400).json({
          error: true,
          message: "Invalid query parameters: year. Query parameters are not permitted.",
        });
      } else if (err instanceof Error && err.name === "RateLimitExceededError") {
        // 返回429错误响应
        res.status(429).send("Too many requests, please try again later.");
      } else {
        // 返回500错误响应
        res.status(500).json({ error: true, message: "Error in MySQL query" });
      }
    });
});


/*router.get("/movies/data/:imdbID", function (req, res, next) { 
    req.db 
      .from("basics")
      .join("principals", "basics.tconst","principals.tconst")
      .join("ratings", "basics.tconst","ratings.tconst")  
      .select("basics.originalTitle", 
      "basics.year", 
      "basics.runtimeMinutes", 
      "basics.genres", 
      "basics.country", 
      "principals.id", 
      "principals.name", 
      "principals.category",
      "principals.characters",
      "ratings.source",
      "ratings.value",
      "basics.boxoffice",
      "basics.poster",
      "basics.plot") 
      .where("basics.tconst", "=", req.params.imdbID) 
      .then((rows) => { 
        const movie = {
          originalTitle: rows[0].originalTitle,
          year: rows[0].year,
          runtimeMinutes: rows[0].runtimeMinutes,
          genres: rows[0].genres,
          country: rows[0].country,
          principals: rows.map((row) => ({
            id: row.id,
            name: row.name,
            category: row.category,
            characters: row.characters,
          })),
          
          ratings: rows.map((row) => ({
            source: row.source,
            value: row.value,
          })),
          boxoffice: rows[0].boxoffice,
          poster: rows[0].poster,
          plot: rows[0].plot,
          
        };
        res.json({ Error: false, Message: "Success", Movie: movie }); 
      }) 
      .catch((err) => { 
        console.log(err); 
        res.json({ Error: true, Message: "Error in MySQL query" }); 
      }); 
  });*/

  
  router.get("/movies/data/:imdbID", function (req, res, next) {
    req.db
      .select(
        "basics.originalTitle",
        "basics.year",
        "basics.runtimeMinutes",
        "basics.genres",
        "basics.country",
        "principals.id",
        "principals.name",
        "principals.category",
        "principals.characters",
        { source: "ratings.source", value: "ratings.value" },
        "basics.boxoffice",
        "basics.poster",
        "basics.plot"
      )
      .from("basics")
      .leftJoin("principals", "basics.tconst", "principals.tconst")
      .leftJoin("ratings", "basics.tconst", "ratings.tconst")
      .where("basics.tconst", "=", req.params.imdbID)
      .then((rows) => {

        // 检查是否找到电影信息
      if (rows.length === 0) {
        // 返回404错误响应
        res.status(404).json({
          error: true,
          message: "No record exists of a movie with this ID",
        });
        return;
      }

        const movie = {
          originalTitle: rows[0].originalTitle,
          year: rows[0].year,
          runtimeMinutes: rows[0].runtimeMinutes,
          genres: rows[0].genres,
          country: rows[0].country,
          principals: rows
            .filter((row) => row.id) // 过滤掉空的 principals 记录. filter empty principals record
            .reduce((uniquePrincipals, row) => {
              if (!uniquePrincipals.some((p) => p.id === row.id)) {
                uniquePrincipals.push({
                  id: row.id,
                  name: row.name,
                  category: row.category,
                  characters: row.characters,
                });
              }
              return uniquePrincipals;
            }, []),
          ratings: rows
            .filter((row) => row.source && row.value) // 过滤掉空的 ratings 记录. filter empty ratings record
            .reduce((uniqueRatings, row) => {
              if (!uniqueRatings.some((r) => r.source === row.source && r.value === row.value)) {
                uniqueRatings.push({
                  source: row.source,
                  value: row.value,
                });
              }
              return uniqueRatings;
            }, []),
          boxoffice: rows[0].boxoffice,
          poster: rows[0].poster,
          plot: rows[0].plot,
        };
  
        res.json({ Error: false, Message: "Success", Movie: movie });
      })
      .catch((err) => {
        console.log(err);

        // 根据错误类型返回相应的错误响应
      if (err instanceof Error && err.name === "InvalidQueryParametersError") {
        // 返回400错误响应
        res.status(400).json({
          error: true,
          message: "Invalid query parameters: year. Query parameters are not permitted.",
        });
      } else if (err instanceof Error && err.name === "RateLimitExceededError") {
        // 返回429错误响应
        res.status(429).send("Too many requests, please try again later.");
      } else {
        // 返回500错误响应
        res.status(500).json({ error: true, message: "Error in MySQL query" });
      }
      });
  });
  

router.post('/movies/update', authorization, (req, res) => {
  if (!req.body.Basics || !req.body.Year || !req.body.Runtime) {
    res.status(400).json({ message: `Error updating runtimeMinutes` });
    console.log(`Error on request body:`, JSON.stringify(req.body));

  } else {
    const filter = {
      "primaryTitle": req.body.Basics,
      "year": req.body.Year
    };
    const runtime = {
      "runtimeMinutes": req.body.Runtime
    };
    req.db('basics').where(filter).update(runtime)
      .then(_ => {
        res.status(201).json({ message: `Successful update ${req.body.Basics}` });
        console.log(`successful runtimeMinutes update:`, JSON.stringify(filter));
      }).catch(error => {
        res.status(500).json({ message: 'Database error - not updated' });
      });
  }
});

router.get("/people/:id", authorization, function (req, res, next) {
   

  req.db
    .select(
      "names.primaryName",
      "names.birthYear",
      "names.deathYear",
      "principals.category",
      "principals.characters",
      "basics.originalTitle",
      "basics.tconst",
      "basics.imdbRating"
    )
    .from("names")
    .leftJoin("principals", "names.nconst", "principals.nconst")
    .leftJoin("basics", "principals.tconst", "basics.tconst")
    .where("names.nconst", "=", req.params.id)
    .then((rows) => {
      // 检查是否找到人物信息
      if (rows.length === 0) {
        // 返回404错误响应
        res.status(404).json({
          error: true,
          message: "No record exists of a person with this ID",
        });
        return;
      }

      const person = {
        primaryName: rows[0].primaryName,
        birthYear: rows[0].birthYear,
        deathYear: rows[0].deathYear,
        roles: rows.map((row) => ({
          movieName: row.originalTitle,
          movieId: row.tconst,
          category: row.category,
          characters: row.characters,
          imdbRating: row.imdbRating,
        })),
      };

      res.json({ Error: false, Message: "Success", Person: person });
    })
    .catch((err) => {
      console.log(err);

      // 根据错误类型返回相应的错误响应
      if (err instanceof Error && err.name === "InvalidQueryParametersError") {
        // 返回400错误响应
        res.status(400).json({
          error: true,
          message: "Invalid query parameters: year. Query parameters are not permitted.",
        });
      } else if (err instanceof Error && err.name === "RateLimitExceededError") {
        // 返回429错误响应
        res.status(429).send("Too many requests, please try again later.");
      } else {
        // 返回500错误响应
        res.status(500).json({ error: true, message: "Error in MySQL query" });
      }
    });
});

  
module.exports = router;
