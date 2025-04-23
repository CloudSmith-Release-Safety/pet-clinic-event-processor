/**
 * Class representing a Pet Clinic Report
 */
class PetClinicReport {
  /**
   * Create a new Pet Clinic Report
   * @param {Object} reportInfo - Information about the report
   * @param {string} reportInfo.reportId - Unique identifier for the report
   * @param {string} reportInfo.clinicName - Name of the pet clinic
   * @param {string} reportInfo.reportDate - ISO date string when the report was generated
   * @param {Object} reportInfo.reportPeriod - Period covered by the report
   * @param {string} reportInfo.reportPeriod.startDate - ISO date string for period start
   * @param {string} reportInfo.reportPeriod.endDate - ISO date string for period end
   * @param {string} reportInfo.generatedBy - Name of person who generated the report
   * @param {string} reportInfo.reportType - Type of report (e.g., "MONTHLY_SUMMARY")
   * @param {Object} clinicSummary - Summary statistics for the clinic
   * @param {number} clinicSummary.totalAppointments - Total number of appointments
   * @param {number} clinicSummary.newPatients - Number of new patients
   * @param {number} clinicSummary.returningPatients - Number of returning patients
   * @param {number} clinicSummary.canceledAppointments - Number of canceled appointments
   * @param {number} clinicSummary.noShows - Number of no-shows
   * @param {number} clinicSummary.emergencyCases - Number of emergency cases
   * @param {number} clinicSummary.averageWaitTime - Average wait time in minutes
   * @param {number} clinicSummary.averageVisitDuration - Average visit duration in minutes
   * @param {number} clinicSummary.patientSatisfactionScore - Average patient satisfaction score
   */
  constructor(reportInfo, clinicSummary) {
    this.reportInfo = reportInfo;
    this.clinicSummary = clinicSummary;
  }

  /**
   * Create a PetClinicReport instance from JSON data
   * @param {Object|string} jsonData - JSON object or string to parse
   * @returns {PetClinicReport} A new PetClinicReport instance
   */
  static fromJson(jsonData) {
    const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    return new PetClinicReport(data.reportInfo, data.clinicSummary);
  }

  /**
   * Convert the report to a JSON string
   * @returns {string} JSON string representation of the report
   */
  toJson() {
    return JSON.stringify(this);
  }

  /**
   * Get the report ID
   * @returns {string} The report ID
   */
  getReportId() {
    return this.reportInfo.reportId;
  }

  /**
   * Get the clinic name
   * @returns {string} The clinic name
   */
  getClinicName() {
    return this.reportInfo.clinicName;
  }

  /**
   * Get the report date
   * @returns {Date} The report date as a Date object
   */
  getReportDate() {
    return new Date(this.reportInfo.reportDate);
  }

  /**
   * Get the report period
   * @returns {Object} Object containing start and end dates
   */
  getReportPeriod() {
    return {
      startDate: new Date(this.reportInfo.reportPeriod.startDate),
      endDate: new Date(this.reportInfo.reportPeriod.endDate)
    };
  }

  /**
   * Get the name of the person who generated the report
   * @returns {string} Name of the report generator
   */
  getGeneratedBy() {
    return this.reportInfo.generatedBy;
  }

  /**
   * Get the report type
   * @returns {string} The report type
   */
  getReportType() {
    return this.reportInfo.reportType;
  }

  /**
   * Get the total number of appointments
   * @returns {number} Total appointments
   */
  getTotalAppointments() {
    return this.clinicSummary.totalAppointments;
  }

  /**
   * Get the number of new patients
   * @returns {number} New patients count
   */
  getNewPatients() {
    return this.clinicSummary.newPatients;
  }

  /**
   * Get the number of returning patients
   * @returns {number} Returning patients count
   */
  getReturningPatients() {
    return this.clinicSummary.returningPatients;
  }

  /**
   * Get the number of canceled appointments
   * @returns {number} Canceled appointments count
   */
  getCanceledAppointments() {
    return this.clinicSummary.canceledAppointments;
  }

  /**
   * Get the number of no-shows
   * @returns {number} No-shows count
   */
  getNoShows() {
    return this.clinicSummary.noShows;
  }

  /**
   * Get the number of emergency cases
   * @returns {number} Emergency cases count
   */
  getEmergencyCases() {
    return this.clinicSummary.emergencyCases;
  }

  /**
   * Get the average wait time
   * @returns {number} Average wait time in minutes
   */
  getAverageWaitTime() {
    return this.clinicSummary.averageWaitTime;
  }

  /**
   * Get the average visit duration
   * @returns {number} Average visit duration in minutes
   */
  getAverageVisitDuration() {
    return this.clinicSummary.averageVisitDuration;
  }

  /**
   * Get the patient satisfaction score
   * @returns {number} Patient satisfaction score
   */
  getPatientSatisfactionScore() {
    return this.clinicSummary.patientSatisfactionScore;
  }

  /**
   * Calculate the percentage of new patients
   * @returns {number} Percentage of new patients
   */
  getNewPatientPercentage() {
    return (this.clinicSummary.newPatients / this.clinicSummary.totalAppointments) * 100;
  }

  /**
   * Calculate the percentage of canceled appointments
   * @returns {number} Percentage of canceled appointments
   */
  getCanceledAppointmentPercentage() {
    return (this.clinicSummary.canceledAppointments / this.clinicSummary.totalAppointments) * 100;
  }

  /**
   * Calculate the percentage of no-shows
   * @returns {number} Percentage of no-shows
   */
  getNoShowPercentage() {
    return (this.clinicSummary.noShows / this.clinicSummary.totalAppointments) * 100;
  }

  /**
   * Get a summary of the report as a string
   * @returns {string} Summary of the report
   */
  getSummary() {
    return `Pet Clinic Report: ${this.reportInfo.reportId}
Clinic: ${this.reportInfo.clinicName}
Period: ${new Date(this.reportInfo.reportPeriod.startDate).toLocaleDateString()} to ${new Date(this.reportInfo.reportPeriod.endDate).toLocaleDateString()}
Total Appointments: ${this.clinicSummary.totalAppointments}
New Patients: ${this.clinicSummary.newPatients} (${this.getNewPatientPercentage().toFixed(1)}%)
Patient Satisfaction: ${this.clinicSummary.patientSatisfactionScore}/5.0`;
  }
}

module.exports = PetClinicReport;
