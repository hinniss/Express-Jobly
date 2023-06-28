const { BadRequestError } = require("../expressError");

/* Convert the new data object and key mapping to create SQL query string and reference variables
 ({firstName: 'Aliya, age: 32},{firstName: first_name}) => 
 {setCols: `"first_name"=$1, "age"=$2`, values: ['Aliya',32]}
*/

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
};

/* Convert the new data object and key mapping to create SQL query string and reference variables
 ({name: 'Aliya', minEmployees: 20, maxEmployees: 50) => 
 `SELECT handle,name,description,num_employees AS "numEmployees",logo_url AS "logoUrl"
  FROM companies
  WHERE name='Aliya' AND num_employees >= 20 AND num_employees <= 50
  ORDER BY name`
*/
function sqlForFilterCompanies({name, minEmployees, maxEmployees}) {
  if (!name && !minEmployees && !maxEmployees) {
    throw new BadRequestError("No data");
  };
  let query = `SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl" FROM companies WHERE `;
  const whereStatements = [];
  if (name) {
    whereStatements.push(`name = '${name}'`);
  };
  if (minEmployees) {
    whereStatements.push(`num_employees >= ${minEmployees}`);
  };
  if (maxEmployees) {
    whereStatements.push(`num_employees <= ${maxEmployees}`);
  };
  const whereQuery = whereStatements.join(" AND ");
  query += whereQuery;
  query += ` ORDER BY name`;
  return query;
};

/* Convert the new data object and key mapping to create SQL query string and reference variables
 ({title: 'new', salary: 1000, equity: 0.5) => 
 `SELECT id, title, salary, equity, company_handler AS "companyHandler"
  FROM jobs
  WHERE title='new' AND salary >= 1000 AND equity > 0
  ORDER BY title`
*/
function sqlForFilterJobs({title, minSalary,hasEquity}) {
  if (!title && !minSalary && !hasEquity) {
    throw new BadRequestError("No filter");
  }
  let query = `SELECT id, title, salary, equity, company_handle AS "companyHandle" FROM jobs WHERE `;
  const whereStatements = [];
  if (title) {
    whereStatements.push(`title = '${title}'`);
  };
  if (minSalary) {
    whereStatements.push(`salary >= ${minSalary}`);
  };
  if (hasEquity) {
    whereStatements.push(`equity > 0`);
  };
  const whereQuery = whereStatements.join(" AND ");
  query += whereQuery;
  query += ` ORDER BY title`;
  return query;
};

module.exports = { sqlForPartialUpdate, sqlForFilterCompanies, sqlForFilterJobs };
