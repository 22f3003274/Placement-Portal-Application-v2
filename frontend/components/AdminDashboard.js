const AdminDashboard = {
  components: { DashboardLayout },

  template: adminDashboardTemplate,

  data() {
    return {
      tab: "stats",

      stats: {},
      chartData: null,
      students: [],
      companies: [],
      drives: [],
      applications: [],
      studentSearch: "",
      companySearch: ""
    };
  },

  watch: {
    chartData(data) {
      if (!data) return;
      this.$nextTick(() => {
        ['studentsChart', 'companiesChart', 'drivesChart', 'placementsChart'].forEach(id => {
          const existing = Chart.getChart(id);
          if (existing) existing.destroy();
        });

        new Chart(document.getElementById('studentsChart'), {
          type: 'pie',
          data: {
            labels: ['Active', 'Blacklisted'],
            datasets: [{ data: [data.students.active, data.students.blacklisted], backgroundColor: ['#28a745', '#dc3545'] }]
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
        });

        new Chart(document.getElementById('companiesChart'), {
          type: 'pie',
          data: {
            labels: ['Approved', 'Pending', 'Blacklisted', 'Rejected'],
            datasets: [{ data: [data.companies.approved, data.companies.pending, data.companies.blacklisted, data.companies.rejected], backgroundColor: ['#28a745', '#ffc107', '#343a40', '#dc3545'] }]
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
        });

        new Chart(document.getElementById('drivesChart'), {
          type: 'pie',
          data: {
            labels: ['Approved', 'Rejected', 'Closed'],
            datasets: [{ data: [data.drives.approved, data.drives.rejected, data.drives.closed], backgroundColor: ['#28a745', '#dc3545', '#6c757d'] }]
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
        });

        const totalStudents = data.students.active + data.students.blacklisted;
        new Chart(document.getElementById('placementsChart'), {
          type: 'bar',
          data: {
            labels: ['Placed', 'Offer', 'Ongoing'],
            datasets: [{ 
              label: 'Students',
              data: [data.placements.placed, data.placements.offer, data.placements.ongoing],
              backgroundColor: ['#28a745', '#17a2b8', '#ffc107']
            }]
          },
          options: { 
            indexAxis: 'y', 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { legend: { display: false } },
            scales: { x: { beginAtZero: true, max: totalStudents } }
          }
        });
      });
    },

    tab(newTab) {
      if (newTab === 'stats') this.getChartStats();
    }
  },


  methods: {
    async getStats() {
      const response = await fetch(API + "/admin/stats", {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") }
      });
      this.stats = await response.json();
    },

    async getChartStats() {
      const response = await fetch(API + "/admin/chart-stats", {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") }
      });
      this.chartData = await response.json();
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
    this.getChartStats();
    this.getStudents();
    this.getCompanies();
    this.getDrives();
    this.getApplications();
  }
};

