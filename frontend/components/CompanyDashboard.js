const CompanyDashboard = {
  components: { DashboardLayout },

  template: companyDashboardTemplate,

  data() {
    return {
      company: null,
      drives: [],
      applications: [],
      total_drives: 0,
      total_applications: 0,

      tab: "stats",

      newDrive: {
        job_title: "",
        job_description: "",
        eligibility_criteria: "",
        salary_lpa: "",
        application_deadline: ""
      }
    };
  },

  methods: {
    async getDashboard() {
      const response = await fetch(API + "/company/dashboard", {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") }
      });

      const data = await response.json();

      this.company = data.company;
      this.drives = data.drives;
      this.total_drives = data.total_drives;
      this.total_applications = data.total_applications;
    },


    async createDrive() {
      const response = await fetch(API + "/company/drive/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + localStorage.getItem("token") },
        body: JSON.stringify(this.newDrive)
      });

      if (response.ok) {
        alert("Drive created");
        this.getDashboard();
        this.tab = "drives";
      }
    },


    async closeDrive(driveId) {
      const response = await fetch(
        API + "/company/drive/close/" + driveId,
        {
          method: "POST",
          headers: { Authorization: "Bearer " + localStorage.getItem("token") }
        }
      );

      if (response.ok) {
        this.getDashboard();
      }
    },



    async getApplications(driveId) {
      const response = await fetch(API + "/company/drive/" + driveId + "/applications",
        { headers: { Authorization: "Bearer " + localStorage.getItem("token") } }
      );

      this.applications = await response.json();
      this.tab = "applications";
    },


    async updateStatus(application) {
      await fetch(
        API + "/company/application/" + application.application_id + "/status",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + localStorage.getItem("token") },
          body: JSON.stringify({
            status: application.status,
            interview_date: application.interview_date
          })
        }
      );
    },

    isStatusDisabled(current, option) {
      const flow = { 'applied': 1, 'shortlisted': 2, 'interview': 3, 'offer': 4, 'placed': 5, 'rejected': 6 };

      if ((current === 'rejected' || current === 'placed') && current !== option) {
        return true;
      }
      if (option === 'rejected')
        return false;
      return flow[option] < flow[current];
    },

    async exportHistory() {
      const res = await fetch(API + "/company/export-history", {
        method: "POST",
        headers: { Authorization: "Bearer " + localStorage.getItem("token") }
      });
      const data = await res.json();
      if (!data.task_id) return alert("Failed to start export.");

      alert("CSV Export started.");

      const checkStatus = async () => {
        const statusRes = await fetch(API + "/company/task-status/" + data.task_id, {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") }
        });
        const statusData = await statusRes.json();
        if (statusData.state === "SUCCESS") {
          window.open(API.replace('/api', '') + statusData.file_url, "_blank");
          alert("Export complete!");
        } else if (statusData.state === "FAILURE") {
          alert("Export failed.");
        } else {
          setTimeout(checkStatus, 2000);
        }
      };

      checkStatus();
    }
  },

  mounted() {
    this.getDashboard();
  }
};

