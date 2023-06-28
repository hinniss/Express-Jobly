"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate, sqlForFilterJobs } = require("../helpers/sql");
const Company = require("./company");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { id, title, salary, equity, company_handle }
   * */

  static async create({ title, salary, equity, companyHandle }) {
    try {
        await Company.get(companyHandle);
    } catch(err) {
        throw new BadRequestError(`No company: ${companyHandle}`) 
    };
    
    const result = await db.query(
          `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
        [
          title, 
          salary, 
          equity, 
          companyHandle
        ],
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, company_handle }, ...]
   * */

  static async findAll() {
    const jobsRes = await db.query(
          `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           ORDER BY title`);
    return jobsRes.rows;
  }

  /** Find all jobs matching given filter(s)
      Returns [{ id, title, salary, equity, company_handle}]
  */

  static async findByFilter({title, minSalary, hasEquity}) {
    if (!title && !minSalary && !hasEquity) {
      return Job.findAll();
    } else {
      const query = sqlForFilterJobs({title, minSalary, hasEquity});
      const jobsRes = await db.query(query);
      return jobsRes.rows;
    }
  };

  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, company }
   *   where company is { handle, name, description, numEmployees, logoUrl }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
        `SELECT id, 
                title, 
                salary, 
                equity, 
                companies.handle AS "companyHandle", 
                companies.name AS "companyName", 
                companies.description AS "companyDescription",
                companies.num_employees AS "companyNumEmployees", 
                companies.logo_url AS "companyLogoUrl"
        FROM jobs
        LEFT JOIN companies 
        ON jobs.company_handle = companies.handle
        WHERE id = $1`,
    [id]);

    if (!jobRes.rows[0]) throw new NotFoundError(`No job: ${id}`);

    const {
        title, 
        salary, 
        equity, 
        companyHandle, 
        companyName, 
        companyDescription,
        companyNumEmployees,
        companyLogoUrl 
    } = jobRes.rows[0];
    
    const job = {
        id: +id,
        title, 
        salary, 
        equity, 
        company: {
            handle: companyHandle,
            name: companyName,
            description: companyDescription,
            numEmployees: companyNumEmployees,
            logoUrl: companyLogoUrl
        }
    };

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity }
   *
   * Returns {id, title, salary, equity, company_handle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data,{});
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity,
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
        [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}


module.exports = Job;