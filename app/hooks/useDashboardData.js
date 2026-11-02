
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { calculateDashboardAI } from "../lib/ai/aiEngine";

const normalizeDashboardSales = (rows) => {
  return (Array.isArray(rows) ? rows : [])
    .filter((sale) => {
      const isVoided =
        sale?.is_voided === true ||
        String(sale?.is_voided ?? "").toLowerCase() === "true";

      const isDeleted = Boolean(sale?.provider_deleted_at);

      const isTestData =
        sale?.is_test_data === true ||
        String(sale?.is_test_data ?? "").toLowerCase() === "true";

      const isConnected =
        Boolean(sale?.connection_id) ||
        Boolean(sale?.integration_connection_id);

      const status = String(
        sale?.provider_status ?? ""
      ).trim().toLowerCase();

      const isCanceled =
        isConnected &&
        [
          "void",
          "voided",
          "cancelled",
          "canceled",
          "deleted",
        ].includes(status);

      return !isVoided && !isDeleted && !isTestData && !isCanceled;
    })
    .map((sale) => ({
      ...sale,
      date: sale.sale_date || sale.date || null,
      orders:
        sale.orders_count ??
        sale.orders ??
        sale.order_count ??
        sale.total_orders ??
        sale.transactions ??
        sale.tickets ??
        0,
    }));
};

export default function useDashboardData({
  dataOwnerId = null,
  authenticatedUserId = null,
  loadingUser = true,
} = {}) {
  const [dashboardState, setDashboardState] = useState({
    ownerId: null,
    salesData: [],
    inventoryItems: [],
    menuItems: [],
    plan: "starter",
    businessType: "restaurant",
  });

  const [ui, setUI] = useState({
    categoryFilter: "all",
    timeFilter: "today",
  });

  const [loading, setLoading] = useState(true);

  const requestIdRef = useRef(0);
  const currentIdentityRef = useRef("");

  const ownerId = String(dataOwnerId || "").trim();
  const authId = String(authenticatedUserId || "").trim();

  const identityKey =
    !loadingUser && ownerId && authId
      ? `${authId}:${ownerId}`
      : "";

  // Updated during render so requests from a previous account
  // cannot commit results after the identity changes.
  currentIdentityRef.current = identityKey;

  const dataIsCurrent =
    Boolean(identityKey) &&
    dashboardState.ownerId === identityKey;

  const salesData = dataIsCurrent
    ? dashboardState.salesData
    : [];

  const menuItems = dataIsCurrent
    ? dashboardState.menuItems
    : [];

  const inventoryItems = dataIsCurrent
    ? dashboardState.inventoryItems
    : [];

  const plan = dataIsCurrent
    ? dashboardState.plan
    : "starter";

  const businessType = dataIsCurrent
    ? dashboardState.businessType
    : "restaurant";

  const loadDashboardData = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const requestedIdentity = identityKey;

    const isCurrentRequest = () =>
      requestId === requestIdRef.current &&
      requestedIdentity === currentIdentityRef.current;

    if (!requestedIdentity) {
      setDashboardState({
        ownerId: null,
        salesData: [],
        inventoryItems: [],
        menuItems: [],
        plan: "starter",
        businessType: "restaurant",
      });
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user: authenticatedUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (!isCurrentRequest()) return;

      if (authError) throw authError;

      if (authenticatedUser?.id !== authId) {
        throw new Error("Authenticated account changed during dashboard load.");
      }

      const [
        menuResult,
        salesResult,
        inventoryResult,
        profileResult,
      ] = await Promise.all([
        supabase
          .from("menu_items")
          .select("*")
          .eq("user_id", ownerId),

        supabase
          .from("sales")
          .select("*")
          .eq("user_id", ownerId)
          .order("sale_date", { ascending: true }),

        supabase
          .from("inventory_purchases")
          .select("*")
          .eq("user_id", ownerId)
          .order("received_date", { ascending: false }),

        supabase
          .from("users")
          .select("plan, business_type")
          .eq("id", authId)
          .maybeSingle(),
      ]);

      if (!isCurrentRequest()) return;

      if (menuResult.error) throw menuResult.error;
      if (salesResult.error) throw salesResult.error;
      if (inventoryResult.error) throw inventoryResult.error;
      if (profileResult.error) throw profileResult.error;

      setDashboardState({
        ownerId: requestedIdentity,
        menuItems: menuResult.data || [],
        salesData: normalizeDashboardSales(salesResult.data),
        inventoryItems: inventoryResult.data || [],
        plan: profileResult.data?.plan || "starter",
        businessType:
          profileResult.data?.business_type || "restaurant",
      });
    } catch (error) {
      if (isCurrentRequest()) {
        console.error("Dashboard data load error:", error);

        setDashboardState({
          ownerId: requestedIdentity,
          salesData: [],
          inventoryItems: [],
          menuItems: [],
          plan: "starter",
          businessType: "restaurant",
        });
      }
    } finally {
      if (isCurrentRequest()) {
        setLoading(false);
      }
    }
  }, [identityKey, ownerId, authId]);

  useEffect(() => {
    loadDashboardData();

    return () => {
      ++requestIdRef.current;
    };
  }, [loadDashboardData]);

  const aiData = useMemo(() => {
    return calculateDashboardAI({
      menuItems,
      salesData,
      inventoryItems,
      categoryFilter: ui.categoryFilter,
      timeFilter: ui.timeFilter,
      businessType,
    });
  }, [
    menuItems,
    salesData,
    inventoryItems,
    ui.categoryFilter,
    ui.timeFilter,
    businessType,
  ]);

  const totalOrders = useMemo(() => {
    return salesData.reduce((sum, item) => {
      const count = Number(
        item.orders_count ??
        item.orders ??
        item.order_count ??
        item.total_orders ??
        item.transactions ??
        item.tickets ??
        0
      );

      return sum +
        (Number.isFinite(count) && count > 0 ? count : 0);
    }, 0);
  }, [salesData]);

  const aov = useMemo(() => {
    const revenue = Number(aiData?.totalRevenue || 0);

    return totalOrders > 0
      ? revenue / totalOrders
      : 0;
  }, [aiData?.totalRevenue, totalOrders]);

  const setCategoryFilter = (value) => {
    setUI((previous) => ({
      ...previous,
      categoryFilter: value,
    }));
  };

  const setTimeFilter = (value) => {
    setUI((previous) => ({
      ...previous,
      timeFilter: value,
    }));
  };

  const refreshData = useCallback(async () => {
    await loadDashboardData();
  }, [loadDashboardData]);

  return {
    ...aiData,
    plan,
    businessType,
    aov,
    totalOrders,
    categoryFilter: ui.categoryFilter,
    timeFilter: ui.timeFilter,
    setCategoryFilter,
    setTimeFilter,
    refreshData,
    loading: loading || !dataIsCurrent,
  };
}
