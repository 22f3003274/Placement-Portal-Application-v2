const AdminDashboard = {
  components: { DashboardLayout },
  template: `
    <DashboardLayout title="Admin Panel">
      <div>
        <div>
          <ul>
            <li>
              <a :class="{ active: tab === 'stats' }" @click.prevent="tab = 'stats'" href="#">Stats</a>
            </li>
            <li>
              <a :class="{ active: tab === 'studs' }" @click.prevent="tab = 'studs'" href="#">Students</a>
            </li>
            <li>
              <a :class="{ active: tab === 'comps' }" @click.prevent="tab = 'comps'" href="#">Companies</a>
            </li>
            <li>
              <a :class="{ active: tab === 'drives' }" @click.prevent="tab = 'drives'" href="#">Placement Drives</a>
            </li>
            <li>
              <a :class="{ active: tab === 'apps' }" @click.prevent="tab = 'apps'" href="#">Applications</a>
            </li>
          </ul>
        </div>
      </div>

      <div v-if="tab === 'stats'">
        <div>
          <div>
            <div>
              <h5>Students</h5>
              <h2>{{ st.students }}</h2>
            </div>
          </div>
          <div>
            <div>
              <h5>Companies</h5>
              <h2>{{ st.companies }}</h2>
            </div>
          </div>
          <div>
            <div>
              <h5>Placement Drives</h5>
              <h2>{{ st.drives }}</h2>
            </div>
          </div>
          <div>
            <div>
              <h5>Applications</h5>
              <h2>{{ st.applications }}</h2>
            </div>
          </div>
        </div>
      </div>

      <div v-if="tab === 'studs'">
        <div>
          <input v-model="s_search" placeholder="Search by name/email/phone/roll number" />
          <button @click="getStuds">Search</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Roll No.</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in studs" :key="s.id">
              <td>{{ s.name }}</td>
              <td>{{ s.email }}</td>
              <td>{{ s.roll_number || 'N/A' }}</td>
              <td>
                <span v-if="s.is_blacklisted">Blacklisted</span>
                <span v-else>Active</span>
              </td>
              <td>
                <button @click="blk(s.id)">
                  {{ s.is_blacklisted ? 'Unblacklist' : 'Blacklist' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="tab === 'comps'">
        <div>
          <input v-model="c_search" placeholder="Search by company name" />
          <button @click="getComps">Search</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Website</th>
              <th>Approval</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in comps" :key="c.id">
              <td>{{ c.company_name }}</td>
              <td>{{ c.website || 'N/A' }}</td>
              <td>
                <span v-if="c.approval_status === 'pending'">Pending</span>
                <span v-if="c.approval_status === 'approved'">Approved</span>
                <span v-if="c.approval_status === 'rejected'">Rejected</span>
              </td>
              <td>
                <span v-if="c.is_blacklisted">Blacklisted</span>
                <span v-else>Good Standing</span>
              </td>
              <td>
                <button @click="chComp(c.id, 'approved')" v-if="c.approval_status !== 'approved'">Approve</button>
                <button @click="chComp(c.id, 'rejected')" v-if="c.approval_status !== 'rejected'">Reject</button>
                <button @click="blk(c.user_id)">{{ c.is_blacklisted ? 'Unblacklist' : 'Blacklist' }}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="tab === 'drives'">
        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Job Title</th>
              <th>Salary (LPA)</th>
              <th>Deadline</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in drives" :key="d.id">
              <td>{{ d.company_name }}</td>
              <td>{{ d.job_title }}</td>
              <td>{{ d.salary_lpa || 'N/A' }}</td>
              <td>{{ d.application_deadline }}</td>
              <td>
                <span v-if="d.status === 'pending'">Pending</span>
                <span v-if="d.status === 'approved'">Approved</span>
                <span v-if="d.status === 'rejected'">Rejected</span>
                <span v-if="d.status === 'closed'">Closed</span>
              </td>
              <td>
                <button @click="chDrive(d.id, 'approved')" v-if="d.status === 'pending'">Approve</button>
                <button @click="chDrive(d.id, 'rejected')" v-if="d.status === 'pending'">Reject</button>
                <button @click="chDrive(d.id, 'closed')" v-if="d.status === 'approved'">Close</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="tab === 'apps'">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Company</th>
              <th>Job Title</th>
              <th>Status</th>
              <th>Applied At</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(a, i) in apps" :key="i">
              <td>{{ a.student_name }}</td>
              <td>{{ a.company_name }}</td>
              <td>{{ a.job_title }}</td>
              <td><span>{{ a.status }}</span></td>
              <td>{{ a.applied_at }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  `,
  data() {
    return {
      tab: "stats",
      st: {},
      studs: [],
      comps: [],
      drives: [],
      apps: [],
      s_search: "",
      c_search: ""
    };
  },
  methods: {
    async getSt() {
      const r = await fetch(API + "/admin/stats", {
        headers: { "Authorization": "Bearer " + userAuth.getTok() }
      });
      this.st = await r.json();
    },
    async getStuds() {
      const r = await fetch(API + "/admin/students?search=" + this.s_search, {
        headers: { "Authorization": "Bearer " + userAuth.getTok() }
      });
      this.studs = await r.json();
    },
    async getComps() {
      const r = await fetch(API + "/admin/companies?search=" + this.c_search, {
        headers: { "Authorization": "Bearer " + userAuth.getTok() }
      });
      this.comps = await r.json();
    },
    async getDrives() {
      const r = await fetch(API + "/admin/drives", {
        headers: { "Authorization": "Bearer " + userAuth.getTok() }
      });
      this.drives = await r.json();
    },
    async getApps() {
      const r = await fetch(API + "/admin/applications", {
        headers: { "Authorization": "Bearer " + userAuth.getTok() }
      });
      this.apps = await r.json();
    },

    async blk(uid) {
      await fetch(API + "/admin/users/" + uid + "/toggle-blacklist", {
        method: "POST",
        headers: { "Authorization": "Bearer " + userAuth.getTok() }
      });
      this.getStuds();
      this.getComps();
    },
    async chComp(cid, st) {
      await fetch(API + "/admin/companies/" + cid + "/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + userAuth.getTok()
        },
        body: JSON.stringify({ status: st })
      });
      this.getComps();
      this.getSt();
    },
    async chDrive(did, st) {
      await fetch(API + "/admin/drives/" + did + "/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + userAuth.getTok()
        },
        body: JSON.stringify({ status: st })
      });
      this.getDrives();
      this.getSt();
    }
  },
  mounted() {
    this.getSt();
    this.getStuds();
    this.getComps();
    this.getDrives();
    this.getApps();
  }
};
