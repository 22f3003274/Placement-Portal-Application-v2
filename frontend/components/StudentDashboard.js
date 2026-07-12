const StudentDashboard = {
  components: { DashboardLayout },

  template: studentDashboardTemplate,

  data() {
    return {
      student: {},
      drives: [],
      applications: [],
      tab: "drives",
      resume: null
    };
  },
  computed: {
    backendUrl() {
      return typeof API !== 'undefined' ? API.replace('/api', '') : 'http://localhost:5000';
    }
  },

  methods: {
    selectFile(event) {
      this.resume = event.target.files[0];
    },

    async getDashboard() {
      const response = await fetch(API + "/student/dashboard?t=" + new Date().getTime(), {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") }
      });

      const data = await response.json();

      this.student = data.student;
      this.drives = data.drives;
      this.applications = data.applications;
    },

    getApplication(driveId) {
      return this.applications.find(app => app.drive_id === driveId);
    },

    formatHistory(logs) {
      if (!logs) return "";
      let statuses = logs.map(log => log.status_to);
      return [...new Set(statuses)].join(" → ");
    },

    getBadgeClass(status) {
      if (['applied', 'shortlisted', 'interview'].includes(status)) return 'bg-warning text-dark';
      if (status === 'offer') return 'bg-info text-dark';
      if (status === 'placed') return 'bg-success';
      if (status === 'rejected') return 'bg-danger';
      return 'bg-secondary';
    },


    async updateProfile() {
      const form = new FormData();

      form.append("roll_number", this.student.roll_number || "");
      form.append("branch", this.student.branch || "");
      form.append("year", this.student.year || "");
      form.append("cgpa", this.student.cgpa || "");
      form.append("skills", this.student.skills || "");
      if (this.resume) {
        form.append("resume", this.resume);
      }

      const response = await fetch(API + "/student/profile/update", {
        method: "POST",
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
        body: form
      });

      if (response.ok) {
        alert("Profile updated!");
        this.getDashboard();
      } else {
        let errorMsg = "Failed to update profile";
        try {
          const data = await response.json();
          errorMsg = data.error || errorMsg;
        } catch (e) {
          console.error("Non-JSON response from server", e);
        }
        alert(errorMsg);
      }
    },


    async apply(driveId) {
      const response = await fetch(API + "/student/apply/" + driveId, {
        method: "POST",
        headers: { Authorization: "Bearer " + localStorage.getItem("token") }
      });

      if (response.ok) { alert("Applied successfully"); this.getDashboard(); }
      else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to apply");
      }
    },

    async exportHistory() {
      const res = await fetch(API + "/student/export-history", {
        method: "POST",
        headers: { Authorization: "Bearer " + localStorage.getItem("token") }
      });
      const data = await res.json();
      if (!data.task_id) return alert("Failed to start export.");

      alert("CSV Export started. Please wait, you will be prompted to download once complete.");

      const checkStatus = async () => {
        const statusRes = await fetch(API + "/student/task-status/" + data.task_id, {
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

