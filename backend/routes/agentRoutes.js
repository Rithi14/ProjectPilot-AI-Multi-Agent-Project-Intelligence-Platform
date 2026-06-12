const express = require("express");
const Groq = require("groq-sdk");
const db = require("../config/db");

const router = express.Router();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

/* ========================================= */
/* PLANNER AGENT */
/* ========================================= */

router.post("/planner", async (req, res) => {

  try {

    const {
      projectId,
      title,
      description
    } = req.body;

    const completion =
      await groq.chat.completions.create({

        model: "llama-3.3-70b-versatile",

        messages: [

          {
            role: "system",
            content:
              "You are a Senior Project Planning Agent."
          },

          {
            role: "user",
            content: `
Project:
${title}

Description:
${description}

Create:

1. Project Phases
2. Milestones
3. Timeline
4. Deliverables
`
          }

        ],

        temperature: 0.4

      });

    const plannerResponse =
      completion.choices[0].message.content;

    db.query(

      `
      INSERT INTO agent_logs
      (
        project_id,
        agent_name,
        task_given,
        response
      )
      VALUES (?, ?, ?, ?)
      `,

      [
        projectId,
        "Planner Agent",
        title,
        plannerResponse
      ],

      (err) => {

        if (err) {
          console.log(err);
        }

      }

    );

    res.json({

      success: true,

      agent: "Planner Agent",

      response:
        plannerResponse

    });

  } catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,

      message:
        "Planner Agent Failed"

    });

  }

});
/* ========================================= */
/* DEVELOPER AGENT */
/* ========================================= */

router.post("/developer", async (req, res) => {

  console.log("🚀 Developer Route Hit");
  console.log("Request Body:", req.body);

  try {

    const {
      projectId,
      title,
      description
    } = req.body;

    const completion =
      await groq.chat.completions.create({

        model: "llama-3.3-70b-versatile",

        messages: [

          {
            role: "system",
            content:
              "You are a Senior Software Architect and Developer Agent."
          },

          {
            role: "user",
            content: `
Project:
${title}

Description:
${description}

Generate:

1. System Architecture
2. Frontend Technologies
3. Backend Technologies
4. Database Design
5. APIs Required
6. Deployment Strategy

Return detailed developer guidance.
`
          }

        ],

        temperature: 0.4

      });

    const developerResponse =
      completion.choices[0].message.content;

    console.log("✅ Developer Response Generated");
    console.log(developerResponse);

    db.query(

      `
      INSERT INTO agent_logs
      (
        project_id,
        agent_name,
        task_given,
        response
      )
      VALUES (?, ?, ?, ?)
      `,

      [
        projectId,
        "Developer Agent",
        title,
        developerResponse
      ],

      (err) => {

        if (err) {
          console.log("❌ DB ERROR:");
          console.log(err);
        } else {
          console.log("✅ Developer Log Saved");
        }

      }

    );

    res.json({

      success: true,

      agent: "Developer Agent",

      response:
        developerResponse

    });

  }

  catch (error) {

    console.log("❌ DEVELOPER AGENT ERROR:");
    console.log(error);

    res.status(500).json({

      success: false,

      message:
        "Developer Agent Failed"

    });

  }

});

/* ========================================= */
/* TESTER AGENT */
/* ========================================= */

router.post("/tester", async (req, res) => {

  try {

    const {
      projectId,
      title,
      description
    } = req.body;

    const completion =
      await groq.chat.completions.create({

        model: "llama-3.3-70b-versatile",

        messages: [

          {
            role: "system",
            content:
              "You are a Senior QA Tester Agent."
          },

          {
            role: "user",
            content: `
Project:
${title}

Description:
${description}

Generate:

1. Test Cases
2. Unit Testing Plan
3. Integration Testing Plan
4. Performance Testing
5. Security Testing
6. Bug Checklist

Return detailed testing strategy.
`
          }

        ],

        temperature: 0.4

      });

    const testerResponse =
      completion.choices[0].message.content;

    db.query(

      `
      INSERT INTO agent_logs
      (
        project_id,
        agent_name,
        task_given,
        response
      )
      VALUES (?, ?, ?, ?)
      `,

      [
        projectId,
        "Tester Agent",
        title,
        testerResponse
      ]

    );

    res.json({

      success: true,

      agent: "Tester Agent",

      response:
        testerResponse

    });

  }

  catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,

      message:
        "Tester Agent Failed"

    });

  }

});
/* ========================================= */
/* SECURITY AGENT */
/* ========================================= */

router.post("/security", async (req, res) => {

  try {

    const {
      projectId,
      title,
      description
    } = req.body;

    const completion =
      await groq.chat.completions.create({

        model: "llama-3.3-70b-versatile",

        messages: [

          {
            role: "system",
            content:
              "You are a Senior Cyber Security Architect."
          },

          {
            role: "user",
            content: `
Project:
${title}

Description:
${description}

Generate:

1. Security Risks
2. Authentication Plan
3. Authorization Plan
4. API Security
5. Database Security
6. Cloud Security
7. OWASP Risks
8. Security Recommendations
`
          }

        ],

        temperature: 0.4

      });

    const securityResponse =
      completion.choices[0].message.content;

    db.query(

      `
      INSERT INTO agent_logs
      (
        project_id,
        agent_name,
        task_given,
        response
      )
      VALUES (?, ?, ?, ?)
      `,

      [
        projectId,
        "Security Agent",
        title,
        securityResponse
      ]

    );

    res.json({

      success: true,

      agent: "Security Agent",

      response: securityResponse

    });

  }

  catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,

      message:
        "Security Agent Failed"

    });

  }

});
/* ========================================= */
/* DOCUMENTATION AGENT */
/* ========================================= */

router.post("/documentation", async (req, res) => {

  try {

    const {
      projectId,
      title,
      description
    } = req.body;

    const completion =
      await groq.chat.completions.create({

        model: "llama-3.3-70b-versatile",

        messages: [

          {
            role: "system",
            content:
              "You are a Senior Technical Documentation Expert."
          },

          {
            role: "user",
            content: `
Project:
${title}

Description:
${description}

Generate:

1. Project Overview
2. Functional Requirements
3. Non Functional Requirements
4. System Architecture Summary
5. API Documentation
6. Database Design Summary
7. Installation Guide
8. User Guide
9. Deployment Guide

Return professional software documentation.
`
          }

        ],

        temperature: 0.4

      });

    const documentationResponse =
      completion.choices[0].message.content;

    db.query(

      `
      INSERT INTO agent_logs
      (
        project_id,
        agent_name,
        task_given,
        response
      )
      VALUES (?, ?, ?, ?)
      `,

      [
        projectId,
        "Documentation Agent",
        title,
        documentationResponse
      ]

    );

    res.json({

      success: true,

      agent: "Documentation Agent",

      response:
        documentationResponse

    });

  }

  catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,

      message:
        "Documentation Agent Failed"

    });

  }

});
/* ========================================= */
/* COST ESTIMATION AGENT */
/* ========================================= */

router.post("/cost", async (req, res) => {

  try {

    const {
      projectId,
      title,
      description
    } = req.body;

    const completion =
      await groq.chat.completions.create({

        model: "llama-3.3-70b-versatile",

        messages: [

          {
            role: "system",
            content:
              "You are a Senior IT Project Cost Estimation Expert."
          },

          {
            role: "user",
            content: `
Project:
${title}

Description:
${description}

Generate:

1. Frontend Development Cost
2. Backend Development Cost
3. Database Cost
4. Cloud Hosting Cost
5. Testing Cost
6. Security Cost
7. Maintenance Cost
8. Total Estimated Cost

Provide detailed estimation in USD.

Return professional report.
`
          }

        ],

        temperature: 0.4

      });

    const costResponse =
      completion.choices[0].message.content;

    db.query(

      `
      INSERT INTO agent_logs
      (
        project_id,
        agent_name,
        task_given,
        response
      )
      VALUES (?, ?, ?, ?)
      `,

      [
        projectId,
        "Cost Estimation Agent",
        title,
        costResponse
      ],

      (err) => {

        if (err) {
          console.log(err);
        }

      }

    );

    res.json({

      success: true,

      agent: "Cost Estimation Agent",

      response: costResponse

    });

  }

  catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,

      message:
        "Cost Estimation Agent Failed"

    });

  }

});
/* ========================================= */
/* PROJECT MANAGER AGENT */
/* ========================================= */

router.post("/pm", async (req, res) => {

  try {

    const {
      projectId,
      title,
      description
    } = req.body;

    const completion =
      await groq.chat.completions.create({

        model: "llama-3.3-70b-versatile",

        messages: [

          {
            role: "system",
            content:
              "You are a Senior IT Project Manager."
          },

          {
            role: "user",
            content: `
Project:
${title}

Description:
${description}

Generate:

1. Team Structure
2. Resource Allocation
3. Sprint Plan
4. Timeline Recommendations
5. Risk Mitigation Suggestions
6. Project Status Recommendations
7. Final PM Summary

Return professional project management report.
`
          }

        ],

        temperature: 0.4

      });

    const pmResponse =
      completion.choices[0].message.content;

    db.query(

      `
      INSERT INTO agent_logs
      (
        project_id,
        agent_name,
        task_given,
        response
      )
      VALUES (?, ?, ?, ?)
      `,

      [
        projectId,
        "Project Manager Agent",
        title,
        pmResponse
      ]

    );

    res.json({

      success: true,

      agent: "Project Manager Agent",

      response: pmResponse

    });

  }

  catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,

      message:
        "Project Manager Agent Failed"

    });

  }

});



module.exports = router;