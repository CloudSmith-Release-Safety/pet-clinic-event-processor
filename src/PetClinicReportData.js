/**
 * Class representing the report period
 */
class ReportPeriod {
  /**
   * @param {string} startDate - ISO date string for period start
   * @param {string} endDate - ISO date string for period end
   */
  constructor(startDate, endDate) {
    this.startDate = startDate;
    this.endDate = endDate;
  }
}

/**
 * Class representing report information
 */
class ReportInfo {
  /**
   * @param {string} reportId - Unique identifier for the report
   * @param {string} clinicName - Name of the pet clinic
   * @param {string} reportDate - ISO date string when the report was generated
   * @param {ReportPeriod} reportPeriod - Period covered by the report
   * @param {string} generatedBy - Name of person who generated the report
   * @param {string} reportType - Type of report (e.g., "MONTHLY_SUMMARY")
   */
  constructor(reportId, clinicName, reportDate, reportPeriod, generatedBy, reportType) {
    this.reportId = reportId;
    this.clinicName = clinicName;
    this.reportDate = reportDate;
    this.reportPeriod = reportPeriod;
    this.generatedBy = generatedBy;
    this.reportType = reportType;
  }
}

/**
 * Class representing clinic summary statistics
 */
class ClinicSummary {
  /**
   * @param {number} totalAppointments - Total number of appointments
   * @param {number} newPatients - Number of new patients
   * @param {number} returningPatients - Number of returning patients
   * @param {number} canceledAppointments - Number of canceled appointments
   * @param {number} noShows - Number of no-shows
   * @param {number} emergencyCases - Number of emergency cases
   * @param {number} averageWaitTime - Average wait time in minutes
   * @param {number} averageVisitDuration - Average visit duration in minutes
   * @param {number} patientSatisfactionScore - Average patient satisfaction score
   */
  constructor(
    totalAppointments,
    newPatients,
    returningPatients,
    canceledAppointments,
    noShows,
    emergencyCases,
    averageWaitTime,
    averageVisitDuration,
    patientSatisfactionScore
  ) {
    this.totalAppointments = totalAppointments;
    this.newPatients = newPatients;
    this.returningPatients = returningPatients;
    this.canceledAppointments = canceledAppointments;
    this.noShows = noShows;
    this.emergencyCases = emergencyCases;
    this.averageWaitTime = averageWaitTime;
    this.averageVisitDuration = averageVisitDuration;
    this.patientSatisfactionScore = patientSatisfactionScore;
  }

  /**
   * Calculate the percentage of new patients
   * @returns {number} Percentage of new patients
   */
  getNewPatientPercentage() {
    return (this.newPatients / this.totalAppointments) * 100;
  }

  /**
   * Calculate the percentage of canceled appointments
   * @returns {number} Percentage of canceled appointments
   */
  getCanceledAppointmentPercentage() {
    return (this.canceledAppointments / this.totalAppointments) * 100;
  }

  /**
   * Calculate the percentage of no-shows
   * @returns {number} Percentage of no-shows
   */
  getNoShowPercentage() {
    return (this.noShows / this.totalAppointments) * 100;
  }
}

/**
 * Main class representing a Pet Clinic Report
 */
class PetClinicReportData {
  /**
   * @param {ReportInfo} reportInfo - Information about the report
   * @param {ClinicSummary} clinicSummary - Summary statistics for the clinic
   */
  constructor(reportInfo, clinicSummary) {
    this.reportInfo = reportInfo;
    this.clinicSummary = clinicSummary;
  }

  /**
   * Create a PetClinicReportData instance from JSON string
   * @param {string} jsonString - JSON string to parse
   * @returns {PetClinicReportData} A new PetClinicReportData instance
   */
  static fromJson(jsonString) {
    const data = JSON.parse(jsonString);
    return PetClinicReportData.fromObject(data);
  }

  /**
   * Convert the report to a JSON string
   * @returns {string} JSON string representation of the report
   */
  toJson() {
    return JSON.stringify(this.toObject());
  }
}

module.exports = {
  ReportPeriod,
  ReportInfo,
  ClinicSummary,
  PetClinicReportData
};
