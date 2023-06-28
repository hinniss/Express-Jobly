"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  jobIds,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: 'job',
    salary: 100,
    equity: '0.99',
    companyHandle: 'c1'
  };
  const invalidJob = {
      title: 'j4',
      salary: 100,
      equity: '0.99',
      companyHandle: 'bad'
  }

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual(expect.objectContaining(newJob));

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = $1`,[job.id]);
    expect(result.rows).toEqual([
      {
        id: job.id, 
        title: 'job',
        salary: 100, 
        equity: '0.99',
        company_handle: 'c1'
      },
    ]);
  });

  test("fails if invalid company handle", async function () {
    try {
        const res = await Job.create(invalidJob);
        fail();
      } catch (err) {
        expect(err instanceof BadRequestError).toBeTruthy();
      }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: 'j1',
        salary: 1,
        equity: '0.01',
        companyHandle: 'c1'
      },
      {
        id: expect.any(Number),
        title: 'j2',
        salary: 10000,
        equity: '0.5',
        companyHandle: 'c1'
      },
      {
        id: expect.any(Number),
        title: 'j3',
        salary: 1000,
        equity: '0.0',
        companyHandle: 'c2'
      },
      {
          id: expect.any(Number),
          title: 'j4',
          salary: null,
          equity: null,
          companyHandle: 'c2'
      }
    ]);
  });
});

/************************************** findByFilter */
describe("findByFilter", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findByFilter({});
    expect(jobs).toEqual([
        {
            id: expect.any(Number),
            title: 'j1',
            salary: 1,
            equity: '0.01',
            companyHandle: 'c1'
        },
        {
            id: expect.any(Number),
            title: 'j2',
            salary: 10000,
            equity: '0.5',
            companyHandle: 'c1'
        },
        {
            id: expect.any(Number),
            title: 'j3',
            salary: 1000,
            equity: '0.0',
            companyHandle: 'c2'
        },
        {
            id: expect.any(Number),
            title: 'j4',
            salary: null,
            equity: null,
            companyHandle: 'c2'
        }
    ]);
  });
  test("works: title filter", async function () {
    let jobs = await Job.findByFilter({title: 'j1'});
    expect(jobs).toEqual([
        {
            id: expect.any(Number),
            title: 'j1',
            salary: 1,
            equity: '0.01',
            companyHandle: 'c1'
        },
    ]);
  });
  test("works: minSalary filter", async function () {
    let jobs = await Job.findByFilter({minSalary: 1000});
    expect(jobs).toEqual([
        {
            id: expect.any(Number),
            title: 'j2',
            salary: 10000,
            equity: '0.5',
            companyHandle: 'c1'
        },
        {
            id: expect.any(Number),
            title: 'j3',
            salary: 1000,
            equity: '0.0',
            companyHandle: 'c2'
        }
    ]);
  });
  test("works: hasEquity set to true filter", async function () {
    let jobs = await Job.findByFilter({hasEquity: true});
    expect(jobs).toEqual([
        {
            id: expect.any(Number),
            title: 'j1',
            salary: 1,
            equity: '0.01',
            companyHandle: 'c1'
        },
        {
            id: expect.any(Number),
            title: 'j2',
            salary: 10000,
            equity: '0.5',
            companyHandle: 'c1'
        }
    ]);
  });
  test("works: hasEquity set to false filter", async function () {
    let jobs = await Job.findByFilter({hasEquity: false});
    expect(jobs).toEqual([
        {
            id: expect.any(Number),
            title: 'j1',
            salary: 1,
            equity: '0.01',
            companyHandle: 'c1'
        },
        {
            id: expect.any(Number),
            title: 'j2',
            salary: 10000,
            equity: '0.5',
            companyHandle: 'c1'
        },
        {
            id: expect.any(Number),
            title: 'j3',
            salary: 1000,
            equity: '0.0',
            companyHandle: 'c2'
        },
        {
            id: expect.any(Number),
            title: 'j4',
            salary: null,
            equity: null,
            companyHandle: 'c2'
        }
    ]);
  });
  test("works: all filters", async function () {
    let jobs = await Job.findByFilter({title: 'j1', minSalary: 1, hasEquity: true});
    expect(jobs).toEqual([
        {
            id: expect.any(Number),
            title: 'j1',
            salary: 1,
            equity: '0.01',
            companyHandle: 'c1'
        }
    ]);
  });
  test("works: filter has no matches", async function () {
    let jobs = await Job.findByFilter({title: 'j3', minSalary: 5000, hasEquity: true});
    expect(jobs).toEqual([]);
  });
});

/************************************** get */

describe("get", function () {
    test("works", async function () {
        const jobs = await Job.findAll();
        const jobId = jobs[0].id
        let job = await Job.get(jobId);
        expect(job).toEqual({
        id: jobId,
        title: 'j1',
        salary: 1,
        equity: '0.01',
        company: {
            handle: 'c1',
            name: 'C1',
            description: 'Desc1',
            numEmployees: 1,
            logoUrl: 'http://c1.img'
        }
        });
    });

    test("not found if no such job", async function () {
        try {
        await Job.get(0);
        fail();
        } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

/************************************** update */

describe("update", function () {
    const updateData = {
        title: 'new',
        salary: 999,
        equity: '0.99',
    };

    test("works", async function () {
        const jobs = await Job.findAll();
        const jobId = jobs[0].id
        let job = await Job.update(jobId, updateData);
        expect(job).toEqual({
        id: jobId,
        companyHandle: 'c1',
        ...updateData,
        });

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
            FROM jobs
            WHERE id = $1`,[jobId]);
        expect(result.rows).toEqual([{
        id: jobId,
        title: 'new',
        salary: 999,
        equity: '0.99',
        companyHandle: 'c1'
        }]);
    });

    test("works: null fields", async function () {
        const jobs = await Job.findAll();
        const jobId = jobs[0].id
        const updateDataSetNulls = {
        title: 'new',
        salary: null,
        equity: null,
        };

        let job = await Job.update(jobId, updateDataSetNulls);
        expect(job).toEqual({
        id: jobId,
        title: 'new',
        companyHandle: 'c1',
        salary: null,
        equity: null,
        });

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
            FROM jobs
            WHERE id = $1`,[jobId]);
        expect(result.rows).toEqual([{
            id: jobId,
            title: 'new',
            companyHandle: 'c1',
            salary: null,
            equity: null,
        }]);
    });

    test("not found if no such job", async function () {
        try {
        await Job.update(0, updateData);
        fail();
        } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
        }
    });

    test("bad request with no data", async function () {
        try {
            const jobs = await Job.findAll();
            const jobId = jobs[0].id
            await Job.update(jobId, {});
            fail();
        } catch (err) {
        expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** remove */

describe("remove", function () {
    beforeAll( async () => {
        const jobs = await Job.findAll();
        const jobId = jobs[0].id;
    });
  
    test("works", async function () {
        const jobs = await Job.findAll();
        const jobId = jobs[0].id
        await Job.remove(jobId);
        const res = await db.query(
            `SELECT id FROM jobs WHERE id=$1`,[jobId]);
        expect(res.rows.length).toEqual(0);
    });

    test("not found if no such job", async function () {
        try {
        await Job.remove(0);
        fail();
        } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});