---
title: "CKA 학습: Kubernetes 클러스터 구조와 핵심 컴포넌트"
lang: ko
translationKey: kubernetes-cluster-components
pubDatetime: 2026-10-21T23:20:00+09:00
category: "Infra"
featured: false
draft: false
tags:
  - Kubernetes
  - CKA
  - Infrastructure
  - Container Orchestration
description: "CKA를 준비하며 Kubernetes 클러스터의 기본 구조와 워커 노드·컨트롤 플레인의 핵심 컴포넌트 역할을 정리합니다."
---

## Kubernetes 기본 구조 알아보기 

이번에 클라우드 및 인프라 역량을 강화하기 위해 CKA(Certified Kubernetes Administrator) 자격증에 도전하게 되었다!
이번 글은 CKA를 준비하면서 학습한 Kubernetes의 기본 구조와 핵심 컴포넌트들의 역할을 정리한 학습 기록이다.

> 현재 CKA자격증을 목표로 학습해나가는 중이기에 기술적으로 오류가 있을 가능성이 있습니다!
> 감안하여 확인해주신뒤 혹시 오류가 있다면 지적해주시면 정말 감사하겠습니다🙇‍♂️

---
## Kubernetes란?
쿠버네티스(줄여서 K8s라고도 부름)란 수많은 컨테이너화된 애플리케이션을 자동으로 배포,확장,관리 해주는 오픈소스 컨테이너 오케스트레이션 플랫폼이다.
![Kubernetes_logo](assets/Kubernetes_logo_PNG7.png)

---
## 구성요소 알아보기 
### Kubernetes Cluster
> 쿠버네티스가 관리하는 전체 실행환경을 구성하는 논리적인 단위 

쿠버네티스의 구성요소는 우선적으로 전체 실행환경을 구성하는 전체시스템의 논리적인 경계인 Cluster아래에 있으며 구성도는 아래와 같다.

```text
Kubernetes Cluster
├── Control Plane (제어 영역)
│   ├── API Server
│   ├── etcd
│   ├── Scheduler
│   └── Controller Manager
│
└── Worker Nodes (실행 영역)
    ├── Node 1
    │   ├── kubelet
    │   ├── kube-proxy
    │   └── Pods
    └── Node 2
        ├── kubelet
        ├── kube-proxy
        └── Pods
```

### Worker Nodes
> 클러스터의 실행 영역을 맡고있다.
```
Worker Nodes (실행 영역)
    ├── Node 1
    │   ├── kubelet
    │   ├── kube-proxy
    │   └── Pods
    └── Node 2
        ├── kubelet
        ├── kube-proxy
        └── Pods
```
#### Node
클러스터 내에서 실제 워크로드를 실행하는 물리적 머신또는 VM이다.
```
Node 1
  ├── kubelet
  ├── kube-proxy
  └── Pods
```
#### Pod
Pod는 하나 이상의 컨테이너를 포함하는 쿠버네티스 리소스이다.
보통은 하나의 컨테이너만 포함하고 있으며 서로 밀접하게 협력해야 하는 컨테이너 라면 하나의 포드에 같이 배치되기도 한다(ex.스프링 애플리케이션과 해당 애플리케이션의 로그 수집기)

Pod에 여러개의 컨테이너가 있다면 아래와 같은 특성을 띈다.

|구분|공유 여부|
|---|---|
|Pod IP|공유|
|Network Namespace|공유|
|localhost 통신|가능|
|Volume|같은 Volume을 마운트하면 공유|
|Worker Node|반드시 동일|
|컨테이너 프로세스|각각 독립적으로 실행|
|컨테이너 재시작|각각 재시작 가능|

간단히 생각하였을때는 수평확장시에 Pod 내부에 여러개의 컨테이너를 띄우나? 라고 생각할수도 있다
하지만 일반적인 방식은 Pod를 늘려 수평확장을 하게되는데 그러한 이유는 독립적인 스케줄링(Pod를 어느 Node에 실행할지 결정하고 배치하는 과정)과 관리가 가능하다는 이유때문이다.
#### kube-proxy
Node에 존재하며 Service의 ClusterIP로 들어오는 트래픽을 처리할 수 있도록 커널의 네트워크 규칙을 설정한다.
> 여기서 Service란? 특정 Pod 집합에 접근하기 위한 안정적인 네트워크 주소를 제공하는 쿠버네티스 리소스이다.
#### kubelet
자신에게 할당된 Pod를 실제로 실행하고 정상적인 상태로 유지하는 컴포넌트다
- Node 등록 
- Pod 실행 
- 상태 관리 
- 상태 보고 

### Control Plane
> 클러스터의 제어 영역을 맡고있다.

```text
Control Plane (제어 영역)
  ├── API Server
  ├── etcd
  ├── Scheduler
  └── Controller Manager
```

#### API Server
클러스터내의 모든 작업을 오케스트레이션 하는 컴포넌트라고 봐도 무방하다.

모든 컴포넌트는 작업을 실행할때 API서버를 거치게 되는데 이때 API서버를 사용하는 이유는 각 컴포넌트가 
서로 다른 방식으로 데이터를 수정하거나 공통된 인증·인가 및 유효성 검증을 거치지 않을수 있기 때문이다.
#### etcd
고가용성 키-값 저장소로 쿠버네티스 환경에서 사용되는 여러 메타데이터를 담고있다.
#### Scheduler
새로 생성된 Pod를 어느 Worker Node에 배치할지 결정하는 컴포넌트이다.
> 실제 실행은 해당 노드의 kubelet이 담당 

```
사용자
  │
  ▼
kube-apiserver
  │ Pod 객체 생성
  ▼
etcd
  │ API Server를 통해 상태 관찰
  ▼
kube-scheduler
  │ Filtering → Scoring
  │ 노드 배정 요청
  ▼
kube-apiserver
  │ 배정 정보 저장
  ▼
Worker Node의 kubelet
  │ 컨테이너 런타임에 실행 요청
  ▼
containerd
  ▼
컨테이너 실행
```
#### Controller Manager
컨트롤러는 특정 리소스 상태를 지속적으로 관찰 -> 현재 상태가 원하는 상태와 일치하도록 조정 하는 역할이다.
선언적으로 작성된 지시문을 토대로 수행되는데 예를 들어 `Pod가 항상3개가 실행되도록 유지` 라고 요청했다 가정시에 Pod가 2개만 남았다면 컨트롤러가 이를 감지 -> 새로운 Pod를 생성한다 

> 위와 같은 과정을 `Reconciliation Loop(상태 조정 루프)`라고 한다 
##### 대표 컨트롤러 
- **Node Controller** : 클러스터에 등록된 Worker Node들의 상태를 감시하는 컨트롤러 
- **ReplicaSet Controller** : 원하는 개수의 Pod가 유지되도록 관리하는 컨트롤러 
##### Controller Manager 가 API Server와 협력하는 방법 
컨트롤러는 etcd에 직접 접근하지 않고 ReplicaSet 컨트롤러가 Pod가 하나 부족하다는 사실을 확인하면 API서버에 새 Pod 생성 요청을 보낸다.