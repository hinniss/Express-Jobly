"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u4Token
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

console.log('Testing...')
/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: 'new',
    salary: 100,
    equity: 0.5,
    companyHandle: 'c1'
  };

  test("ok for admins", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        ...newJob,
        id: expect.any(Number),
        equity: '0.5'
      }
    });
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          salary: 1000,
          equity: 1.0
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          ...newJob,
          equity: 2.0,
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request for non-admin user", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).toEqual({
      "error": {
        "message": 'Unauthorized',
        "status": 401
      }
    });
  });

  test("bad request for anon", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).toEqual({
      "error": {
        "message": 'Unauthorized',
        "status": 401
      }
    });
  });
});
/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
          [
            {
                id: expect.any(Number),
                title: 'j1',
                salary: 1,
                equity: '0.1',
                companyHandle: 'c1'
            },
            {
                id: expect.any(Number),
                title: 'j2',
                salary: 2,
                equity: '0.5',
                companyHandle: 'c1'
            },
            {
                id: expect.any(Number),
                title: 'j3',
                salary: 3,
                equity: '0',
                companyHandle: 'c2'
            },
            {
                id: expect.any(Number),
                title: 'j4',
                salary: null,
                equity: null,
                companyHandle: 'c2'
            }
          ],
    });
  });

  test("ok with title filter", async function () {
    const resp = await request(app).get(`/jobs?title=j1`);
    expect(resp.body).toEqual({
      jobs:
          [
            {
                id: expect.any(Number), 
                title: 'j1', 
                salary: 1, 
                equity: '0.1',
                companyHandle: 'c1'
            }
          ],
    });
  });

  test("ok with minSalary filter", async function () {
    const resp = await request(app).get("/jobs?minSalary=2");
    expect(resp.body).toEqual({
      jobs:
          [
            {
                id: expect.any(Number), 
                title: 'j2', 
                salary: 2, 
                equity: '0.5',
                companyHandle: 'c1'
            },
            {
                id: expect.any(Number), 
                title: 'j3', 
                salary: 3, 
                equity: '0',
                companyHandle: 'c2'
            }
          ],
    });
  });

  test("ok with hasEquity filter set to true", async function () {
    const resp = await request(app).get("/jobs?hasEquity=true");
    expect(resp.body).toEqual({
      jobs:
          [
            {
                id: expect.any(Number), 
                title: 'j1', 
                salary: 1, 
                equity: '0.1',
                companyHandle: 'c1'
            },
            {
                id: expect.any(Number), 
                title: 'j2', 
                salary: 2, 
                equity: '0.5',
                companyHandle: 'c1'
            },
          ],
    });
  });

  test("ok with hasEquity filter set to false", async function () {
    const resp = await request(app).get("/jobs?hasEquity=false");
    expect(resp.body).toEqual({
      jobs:
          [
            {
                id: expect.any(Number),
                title: 'j1',
                salary: 1,
                equity: '0.1',
                companyHandle: 'c1'
            },
            {
                id: expect.any(Number),
                title: 'j2',
                salary: 2,
                equity: '0.5',
                companyHandle: 'c1'
            },
            {
                id: expect.any(Number),
                title: 'j3',
                salary: 3,
                equity: '0',
                companyHandle: 'c2'
            },
            {
                id: expect.any(Number),
                title: 'j4',
                salary: null,
                equity: null,
                companyHandle: 'c2'
            }
          ],
    });
  });

  test("fails: error if additional query parameters provided", async function () {
    const resp = await request(app).get("/jobs?minSalary=1&other=6");
    expect(resp.statusCode).toBe(400);
    expect(resp.body).toEqual({
      "error": {
        "message": 'query contains unexpected parameters',
        "status": 400
      }
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
        .get("/jobs")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /jobs/:handle */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const allJobsResp = await request(app).get('/jobs');
    const jobId = allJobsResp.body.jobs[0].id;
    const resp = await request(app).get(`/jobs/${jobId}`);
    expect(resp.body).toEqual({
      job: {
        id: jobId,
        title: 'j1',
        salary: 1,
        equity: '0.1',
        company: {
            handle: 'c1',
            name: 'C1', 
            description: 'Desc1',
            numEmployees: 1,
            logoUrl: 'http://c1.img'
        }
      }
    });
  });

  test("works for anon", async function () {
    const allJobsResp = await request(app).get('/jobs');
    const jobId = allJobsResp.body.jobs[0].id;
    const resp = await request(app).get(`/jobs/${jobId}`);
    expect(resp.body).toEqual({
      job: {
        id: jobId,
        title: 'j1',
        salary: 1,
        equity: '0.1',
        company: {
            handle: 'c1',
            name: 'C1', 
            description: 'Desc1',
            numEmployees: 1,
            logoUrl: 'http://c1.img'
        }
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:handle */

describe("PATCH /jobs/:id", function () {
  test("works for admin users", async function () {
    const allJobsResp = await request(app).get('/jobs');
    const jobId = allJobsResp.body.jobs[0].id;
    const resp = await request(app)
        .patch(`/jobs/${jobId}`)
        .send({
          title: "new",
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.body).toEqual({
      job: {
        id: jobId,
        title: 'new',
        salary: 1,
        equity: '0.1',
        companyHandle: 'c1'
      },
    });
  });

  test("unauth for anon", async function () {
    const allJobsResp = await request(app).get('/jobs');
    const jobId = allJobsResp.body.jobs[0].id;
    const resp = await request(app)
        .patch(`/jobs/${jobId}`)
        .send({
          title: "new",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for non-admin", async function () {
    const allJobsResp = await request(app).get('/jobs');
    const jobId = allJobsResp.body.jobs[0].id;
    const resp = await request(app)
        .patch(`/jobs/${jobId}`)
        .send({
          title: "new",
        })
        .set("authorization", `Bearer ${u1Token}`);;
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/0`)
        .send({
          title: "new",
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const allJobsResp = await request(app).get('/jobs');
    const jobId = allJobsResp.body.jobs[0].id;
    const resp = await request(app)
        .patch(`/jobs/${jobId}`)
        .send({
          id: 0,
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on company handle change attempt", async function () {
    const allJobsResp = await request(app).get('/jobs');
    const jobId = allJobsResp.body.jobs[0].id;
    const resp = await request(app)
        .patch(`/jobs/${jobId}`)
        .send({
          companyHandle: 'c3'
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const allJobsResp = await request(app).get('/jobs');
    const jobId = allJobsResp.body.jobs[0].id;
    const resp = await request(app)
        .patch(`/jobs/${jobId}`)
        .send({
          equity: 2.0,
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:handle */

describe("DELETE /jobs/:id", function () {
  test("works for users", async function () {
    const allJobsResp = await request(app).get('/jobs');
    const jobId = allJobsResp.body.jobs[0].id;
    const resp = await request(app)
        .delete(`/jobs/${jobId}`)
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.body).toEqual({ deleted: jobId });
  });

  test("unauth for non-admin user", async function () {
    const allJobsResp = await request(app).get('/jobs');
    const jobId = allJobsResp.body.jobs[0].id;
    const resp = await request(app)
        .delete(`/jobs/${jobId}`)
        .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const allJobsResp = await request(app).get('/jobs');
    const jobId = allJobsResp.body.jobs[0].id;
    const resp = await request(app)
        .delete(`/jobs/${jobId}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
        .delete(`/jobs/0`)
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});