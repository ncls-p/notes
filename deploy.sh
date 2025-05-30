#!/bin/bash

# Script to deploy or upgrade the Noteworthy application using Helm.

set -e # Exit immediately if a command exits with a non-zero status.

# --- Configuration ---
DEFAULT_RELEASE_NAME="noteworthy"
DEFAULT_NAMESPACE="noteworthy"
CHART_PATH="./noteworthy-chart"
DEFAULT_VALUES_FILE="${CHART_PATH}/values.yaml"

# --- Helper Functions ---
print_usage() {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  -r, --release-name <name>   Set the Helm release name (default: ${DEFAULT_RELEASE_NAME})"
  echo "  -n, --namespace <namespace>   Set the Kubernetes namespace (default: ${DEFAULT_NAMESPACE})"
  echo "  -f, --values <file_path>    Path to a custom Helm values file"
  echo "  -h, --help                  Show this help message"
}

# --- Argument Parsing ---
RELEASE_NAME="${DEFAULT_RELEASE_NAME}"
NAMESPACE="${DEFAULT_NAMESPACE}"
VALUES_FILE="" # No custom values file by default, helm will use the chart's default

while [[ "$#" -gt 0 ]]; do
  case $1 in
    -r|--release-name) RELEASE_NAME="$2"; shift ;;
    -n|--namespace) NAMESPACE="$2"; shift ;;
    -f|--values) VALUES_FILE="$2"; shift ;;
    -h|--help) print_usage; exit 0 ;;
    *) echo "Unknown parameter passed: $1"; print_usage; exit 1 ;;
  esac
  shift
done

# --- Pre-flight Checks ---
if ! command -v helm &> /dev/null; then
    echo "Error: helm command not found. Please install Helm."
    exit 1
fi

if [ ! -d "${CHART_PATH}" ]; then
    echo "Error: Chart directory ${CHART_PATH} not found."
    echo "Make sure you are running this script from the project root."
    exit 1
fi

# --- Deployment ---
echo "🚀 Starting deployment of Noteworthy application..."
echo "--------------------------------------------------"
echo "Helm Release Name: ${RELEASE_NAME}"
echo "Kubernetes Namespace: ${NAMESPACE}"
echo "Helm Chart Path: ${CHART_PATH}"

helm_cmd="helm upgrade --install ${RELEASE_NAME} ${CHART_PATH} --namespace ${NAMESPACE} --create-namespace"

if [ -n "${VALUES_FILE}" ]; then
  if [ -f "${VALUES_FILE}" ]; then
    echo "Using custom values file: ${VALUES_FILE}"
    helm_cmd="${helm_cmd} -f ${VALUES_FILE}"
  else
    echo "Warning: Custom values file '${VALUES_FILE}' not found. Using default chart values."
    # Optionally, you could exit here if a specified values file is mandatory but not found
    # exit 1
  fi
else
  echo "Using default values from chart: ${DEFAULT_VALUES_FILE}"
  # Helm uses the chart's values.yaml by default if no -f is specified
fi
echo "--------------------------------------------------"

echo "Executing Helm command:"
echo "${helm_cmd}"
echo "--------------------------------------------------"

if ${helm_cmd}; then
  echo "✅ Deployment/Upgrade of '${RELEASE_NAME}' in namespace '${NAMESPACE}' successful."
  echo "--------------------------------------------------"
  echo "To check the status, run: helm status ${RELEASE_NAME} -n ${NAMESPACE}"
  echo "To get service details (including NodePort if applicable), run: kubectl get svc -n ${NAMESPACE} -l app.kubernetes.io/instance=${RELEASE_NAME}"
else
  echo "❌ Deployment/Upgrade failed."
  exit 1
fi

exit 0