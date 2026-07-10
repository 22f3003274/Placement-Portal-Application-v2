const AdminDashboard = {
  components: { DashboardLayout },

  template: adminDashboardTemplate,

  data() {
    return {
      tab: "stats",

      stats: {},
      students: [],
      companies: [],
      drives: [],
      applications: [],
      studentSearch: "",
      companySearch: ""
    };
  },

  methods: {
    async getStats() {
      const response = await fetch(API + "/admin/stats", {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") }
      });
      this.stats = await response.json();
    },


    async getStudents() {
      const response = await fetch(
        API + "/admin/students?search=" + this.studentSearch,
        {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") }
        }
      );

      this.students = await response.json();
    },


    async getCompanies() {
      const response = await fetch(
        API + "/admin/companies?search=" + this.companySearch,
        {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") }
        }
      );

      this.companies = await response.json();
    },


    async getDrives() {
      const response = await fetch(API + "/admin/drives", {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") }
      });
      this.drives = await response.json();
    },


    async getApplications() {
      const response = await fetch(API + "/admin/applications", {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") }
      });

      this.applications = await response.json();
    },


    async blacklist(userId) {
      await fetch(
        API + "/admin/users/" + userId + "/toggle-blacklist",
        {
          method: "POST",
          headers: { Authorization: "Bearer " + localStorage.getItem("token") }
        }
      );
      this.getStudents();
      this.getCompanies();
    },


    async changeCompanyStatus(companyId, status) {
      await fetch(
        API + "/admin/companies/" + companyId + "/status",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token")
          },
          body: JSON.stringify({ status: status })
        }
      );
      this.getCompanies();
      this.getStats();
    },


    async changeDriveStatus(driveId, status) {
      await fetch(
        API + "/admin/drives/" + driveId + "/status",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token")
          },
          body: JSON.stringify({ status: status })
        }
      );
      this.getDrives();
      this.getStats();
    }
  },

  mounted() {
    this.getStats();
    this.getStudents();
    this.getCompanies();
    this.getDrives();
    this.getApplications();
  }
};

