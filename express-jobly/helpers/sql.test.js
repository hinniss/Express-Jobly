const { sqlForPartialUpdate, sqlForFilterCompanies, sqlForFilterJobs } = require('./sql')

describe('create SQL query for UPDATE', () => {
    test('creates SQL statement for UPDATE', () => {
        const result = sqlForPartialUpdate(
            {firstName: 'Aliya', age: 32},
            {firstName: "first_name"}
        );
        expect(result).toEqual({
            setCols: `"first_name"=$1, "age"=$2`, 
            values: ['Aliya',32]
        });
    });
    test('throws error if no data', () => {
        try{
            sqlForPartialUpdate({},{});
        } catch (err) {
            expect(err.message).toBe('No data');
        };
    });
});

describe('create SQL query with filter for companies', () => {
    test('creates SQL statement with all filters', () => {
        const result = sqlForFilterCompanies({
            name: 'Davis-Davis',
            minEmployees: 10,
            maxEmployees: 50
        });
        expect(result).toBe(`SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl" FROM companies WHERE name = 'Davis-Davis' AND num_employees >= 10 AND num_employees <= 50 ORDER BY name`)
    });
    test('creates SQL statement with name only', () => {
        const result = sqlForFilterCompanies({
            name: 'Davis-Davis',
        });
        expect(result).toBe(`SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl" FROM companies WHERE name = 'Davis-Davis' ORDER BY name`);
    });
    test('creates SQL statement with minEmployees only', () => {
        const result = sqlForFilterCompanies({
            minEmployees: 10
        });
        expect(result).toBe(`SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl" FROM companies WHERE num_employees >= 10 ORDER BY name`);
    });
    test('creates SQL statement with maxEmployees only', () => {
        const result = sqlForFilterCompanies({
            maxEmployees: 50
        });
        expect(result).toBe(`SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl" FROM companies WHERE num_employees <= 50 ORDER BY name`);
    });
    test('creates SQL statement with name and minEmployees only', () => {
        const result = sqlForFilterCompanies({
            name: 'Davis-Davis',
            minEmployees: 10
        });
        expect(result).toBe(`SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl" FROM companies WHERE name = 'Davis-Davis' AND num_employees >= 10 ORDER BY name`);
    });
    test('throws error if no filters', () => {
        try {
            sqlForFilterCompanies({})
        } catch(err) {
            expect(err.message).toBe('No data');
        };
    });
});

describe('create SQL query with filter for jobs', () => {
    test('creates SQL statement with all filters', () => {
        const result = sqlForFilterJobs({
            title: 'j1',
            minSalary: 1000,
            hasEquity: true
        });
        expect(result).toBe(`SELECT id, title, salary, equity, company_handle AS "companyHandle" FROM jobs WHERE title = 'j1' AND salary >= 1000 AND equity > 0 ORDER BY title`);
    });
    test('creates SQL statement with title only', () => {
        const result = sqlForFilterJobs({
            title: 'j1',
        });
        expect(result).toBe(`SELECT id, title, salary, equity, company_handle AS "companyHandle" FROM jobs WHERE title = 'j1' ORDER BY title`)
    });
    test('creates SQL statement with minSalary only', () => {
        const result = sqlForFilterJobs({
            minSalary: 1000
        });
        expect(result).toBe(`SELECT id, title, salary, equity, company_handle AS "companyHandle" FROM jobs WHERE salary >= 1000 ORDER BY title`)
    });
    test('creates SQL statement with hasEquity set to true only', () => {
        const result = sqlForFilterJobs({
            hasEquity: true
        });
        expect(result).toBe(`SELECT id, title, salary, equity, company_handle AS "companyHandle" FROM jobs WHERE equity > 0 ORDER BY title`)
    });
    test('throws error if hasEquity set to false only', () => {
        try {
            const result = sqlForFilterJobs({
                hasEquity: false
            });
        } catch(err) {
            expect(err.message).toBe('No filter');
        }
    });
    test('creates SQL statement with hasEquity set to false and one other filter', () => {
        const result = sqlForFilterJobs({
            title: 'j1',
            hasEquity: false
        });
        expect(result).toBe(`SELECT id, title, salary, equity, company_handle AS "companyHandle" FROM jobs WHERE title = 'j1' ORDER BY title`)
    });
    test('throws error if no filters', () => {
        try {
            sqlForFilterJobs({})
        } catch(err) {
            expect(err.message).toBe('No filter');
        };
    });
});