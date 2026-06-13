{{- define "mypick-nijigasaki.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "mypick-nijigasaki.fullname" -}}
{{- printf "%s" .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "mypick-nijigasaki.labels" -}}
app.kubernetes.io/name: {{ include "mypick-nijigasaki.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
{{- end -}}

{{/*
  selectorLabels — used in Service.spec.selector, Pod.metadata.labels,
  and Deployment.spec.selector.matchLabels. instance is set to
  `<release>-<component>` so each workload has a distinct identity (e.g.
  mypick-nijigasaki-web, mypick-nijigasaki-redis).
*/}}
{{- define "mypick-nijigasaki.selectorLabels" -}}
app.kubernetes.io/name: {{ include "mypick-nijigasaki.name" . }}
app.kubernetes.io/instance: {{ include "mypick-nijigasaki.fullname" . }}-{{ .component }}
app.kubernetes.io/component: {{ .component }}
{{- end -}}

{{/*
  componentLabels — same identity as selectorLabels plus managed-by + chart.
  Used for the workload's own metadata.labels (Deployment / Service /
  ConfigMap level), so all workload-level labels stay consistent with the
  selector.
*/}}
{{- define "mypick-nijigasaki.componentLabels" -}}
app.kubernetes.io/name: {{ include "mypick-nijigasaki.name" . }}
app.kubernetes.io/instance: {{ include "mypick-nijigasaki.fullname" . }}-{{ .component }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
app.kubernetes.io/component: {{ .component }}
{{- end -}}

{{/*
  envFrom: list of Secret refs by component key.
  Usage: {{ include "mypick-nijigasaki.envFrom" (dict "root" $ "secrets" (list "web")) }}
*/}}
{{- define "mypick-nijigasaki.envFrom" -}}
{{- $root := .root -}}
{{- range .secrets }}
- secretRef:
    name: {{ include "mypick-nijigasaki.fullname" $root }}-env-{{ . }}
{{- end -}}
{{- end -}}

{{/* nodeSelector: per-component overrides global. */}}
{{- define "mypick-nijigasaki.nodeSelector" -}}
{{- $ns := default dict .componentNodeSelector -}}
{{- if $ns -}}
{{ toYaml $ns }}
{{- else if .Values.global.nodeSelector -}}
{{ toYaml .Values.global.nodeSelector }}
{{- end -}}
{{- end -}}

{{/*
  Resolve a container image string from global.images by key.
  Usage: {{ include "mypick-nijigasaki.image" (dict "root" $ "key" "web") }}
*/}}
{{- define "mypick-nijigasaki.image" -}}
{{- $img := index .root.Values.global.images .key -}}
{{- printf "%s:%s" $img.repository $img.tag -}}
{{- end -}}

{{/* imagePullPolicy: per-image override else global.imagePullPolicy. */}}
{{- define "mypick-nijigasaki.imagePullPolicy" -}}
{{- $img := index .root.Values.global.images .key -}}
{{- default .root.Values.global.imagePullPolicy $img.pullPolicy -}}
{{- end -}}

{{/* Render imagePullSecrets block (or nothing) for a pod spec. */}}
{{- define "mypick-nijigasaki.imagePullSecrets" -}}
{{- with .Values.global.imagePullSecrets }}
imagePullSecrets:
{{- toYaml . | nindent 2 }}
{{- end }}
{{- end -}}

{{/*
  Service metadata block — user labels merged on top of component labels,
  optional user annotations. Mount where Service metadata.labels normally
  goes (must be inside a `metadata:` block).
*/}}
{{- define "mypick-nijigasaki.serviceMeta" -}}
labels:
  {{- include "mypick-nijigasaki.componentLabels" (merge (dict "component" .component) .root) | nindent 2 }}
  {{- with .svc.labels }}
  {{- toYaml . | nindent 2 }}
  {{- end }}
{{- with .svc.annotations }}
annotations:
  {{- toYaml . | nindent 2 }}
{{- end }}
{{- end -}}

{{/*
  Optional Service spec fields driven by values: loadBalancerIP /
  externalTrafficPolicy. Render at spec level; nodePort goes inside ports[0].
*/}}
{{- define "mypick-nijigasaki.serviceSpecExtras" -}}
{{- with .svc.loadBalancerIP }}
loadBalancerIP: {{ . }}
{{- end }}
{{- with .svc.externalTrafficPolicy }}
externalTrafficPolicy: {{ . }}
{{- end }}
{{- end -}}
