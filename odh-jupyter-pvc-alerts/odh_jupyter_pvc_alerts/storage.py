"""Read filesystem capacity without scanning files or using Kubernetes APIs."""

import os
from typing import TypedDict


class StorageUsage(TypedDict):
    """Filesystem capacity returned by the usage API (sizes in bytes)."""

    path: str
    totalBytes: int
    usedBytes: int
    availableBytes: int
    usagePercent: float


def get_usage(path: str) -> StorageUsage:
    """Report df-style usage, accounting for reserved blocks."""
    stats = os.statvfs(path)
    total = stats.f_blocks * stats.f_frsize
    used = max(0, stats.f_blocks - stats.f_bfree) * stats.f_frsize
    available = max(0, stats.f_bavail) * stats.f_frsize
    usable = used + available
    if total <= 0 or usable <= 0:
        raise OSError("Filesystem does not report usable capacity")
    return {
        "path": path,
        "totalBytes": total,
        "usedBytes": used,
        "availableBytes": available,
        "usagePercent": used / usable * 100,
    }
